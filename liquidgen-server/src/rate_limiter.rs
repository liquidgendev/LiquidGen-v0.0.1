use std::sync::Arc;
use tokio::sync::Mutex;
use std::collections::HashMap;
use std::time::{Duration, Instant};
use axum::{
    extract::State,
    http::StatusCode,
    response::{IntoResponse, Response},
};

#[derive(Clone)]
pub struct RateLimiter {
    requests: Arc<Mutex<HashMap<String, Vec<Instant>>>>,
    window: Duration,
    max_requests: usize,
}

impl RateLimiter {
    pub fn new(window_secs: u64, max_requests: usize) -> Self {
        Self {
            requests: Arc::new(Mutex::new(HashMap::new())),
            window: Duration::from_secs(window_secs),
            max_requests,
        }
    }

    pub async fn check_rate_limit(&self, key: &str) -> bool {
        let now = Instant::now();
        let mut requests = self.requests.lock().await;
        
        // Clean up old entries
        requests.retain(|_, timestamps| {
            timestamps.retain(|&t| now.duration_since(t) <= self.window);
            !timestamps.is_empty()
        });
        
        let timestamps = requests.entry(key.to_string()).or_insert_with(Vec::new);
        
        // Remove timestamps outside the window
        timestamps.retain(|&t| now.duration_since(t) <= self.window);
        
        if timestamps.len() >= self.max_requests {
            return false;
        }
        
        timestamps.push(now);
        true
    }
}

pub async fn rate_limit_middleware<B>(
    State(limiter): State<RateLimiter>,
    req: axum::extract::Request<B>,
    next: axum::middleware::Next<B>,
) -> Response {
    // Get client IP or some other identifier
    let client_id = req
        .headers()
        .get("x-forwarded-for")
        .and_then(|h| h.to_str().ok())
        .unwrap_or("unknown")
        .to_string();

    if !limiter.check_rate_limit(&client_id).await {
        return (
            StatusCode::TOO_MANY_REQUESTS,
            "Rate limit exceeded. Please try again later.".to_string(),
        )
            .into_response();
    }

    next.run(req).await
}

#[cfg(test)]
mod tests {
    use super::*;
    use tokio::time::sleep;

    #[tokio::test]
    async fn test_rate_limiter() {
        let limiter = RateLimiter::new(1, 2); // 2 requests per second
        let key = "test_user";

        assert!(limiter.check_rate_limit(key).await); // First request
        assert!(limiter.check_rate_limit(key).await); // Second request
        assert!(!limiter.check_rate_limit(key).await); // Third request (should fail)

        // Wait for window to pass
        sleep(Duration::from_secs(1)).await;
        assert!(limiter.check_rate_limit(key).await); // Should work again
    }
}