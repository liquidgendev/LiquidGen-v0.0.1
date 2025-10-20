# Security Policy

## Supported Versions

We release patches for security vulnerabilities for the following versions:

| Version | Supported          |
| ------- | ------------------ |
| 0.0.1   | :white_check_mark: |

## Reporting a Vulnerability

We take the security of LiquidGen seriously. If you believe you have found a security vulnerability, please report it to us as described below.

**Please do not report security vulnerabilities through public GitHub issues.**

Instead, please report them via email to security@liquidgen.io (once available) or directly to the maintainers:

- Include the words "SECURITY VULNERABILITY" in your subject line
- Provide a description of the vulnerability
- Provide steps to reproduce the issue
- If known, provide suggestions for remediation

You will receive a response from us within 48 hours. If the issue is confirmed, we will release a patch as soon as possible depending on complexity.

## Security Measures

LiquidGen implements several security measures:

1. **Smart Contract Security**
   - Program audits before mainnet deployment
   - PDA-based authority control
   - Rate limiting and quota systems
   - Multisig governance

2. **Backend Security**
   - TLS encryption
   - Rate limiting
   - IP-based request throttling
   - JWT authentication
   - Input validation
   - CORS protection

3. **Frontend Security**
   - CSP headers
   - XSS protection
   - CSRF tokens
   - Secure wallet connections
   - Input sanitization

4. **Infrastructure Security**
   - Regular security updates
   - Access control
   - Monitoring and logging
   - DDoS protection

## Bug Bounty Program

Our bug bounty program will be launched after mainnet deployment. Details will be published here.

## Security Considerations for Contributors

When contributing to LiquidGen, please ensure:

1. No sensitive keys/credentials in code
2. All dependencies are up-to-date
3. Input validation is thorough
4. Error messages don't leak sensitive info
5. Proper access control checks
6. Rate limiting where appropriate
7. Secure RPC configurations

## Incident Response

In case of a security incident:

1. The issue will be immediately investigated
2. Affected systems will be isolated
3. A fix will be developed and tested
4. A security patch will be released
5. Users will be notified if impacted

## Contact

For security-related questions, contact:
security@liquidgen.io (once available)