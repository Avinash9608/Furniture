# Git Environment Variable Security

This document provides guidelines for securely managing environment variables in a Git repository.

## Why Environment Variables Should Not Be Committed

Environment variables often contain sensitive information such as:

- API keys and secrets
- Database credentials
- JWT secrets
- OAuth tokens
- Other sensitive configuration

Committing these to a Git repository poses several security risks:

1. **Unauthorized Access**: Anyone with access to the repository can see the credentials
2. **Data Breaches**: If the repository is public or gets compromised, sensitive data is exposed
3. **Historical Vulnerability**: Even if you remove the credentials later, they remain in the Git history
4. **Compliance Issues**: May violate security policies or regulations like GDPR, PCI DSS, etc.

## How to Properly Handle Environment Variables

### 1. Use .gitignore

Add patterns to your `.gitignore` file to prevent environment files from being tracked:

```
# Ignore all .env files
.env
.env.*
.env*
*.env

# Exception for example files
!.env.example
```

### 2. Provide Example Files

Create `.env.example` files with placeholder values to serve as templates:

```
# Database Configuration
DB_HOST=localhost
DB_USER=username
DB_PASS=password
DB_NAME=database_name

# API Keys (replace with your actual keys)
API_KEY=your_api_key_here
```

### 3. Use Environment Variable Management Tools

Consider using tools like:

- **dotenv**: For loading environment variables from files
- **Vault**: For secure storage and access of secrets
- **AWS Secrets Manager** or **Azure Key Vault**: For cloud-based secrets management

### 4. What to Do If Sensitive Data Was Committed

If you accidentally committed sensitive data:

1. **Change the credentials immediately**: Assume they are compromised
2. **Remove from Git history**: Use tools like BFG Repo-Cleaner or git-filter-branch
3. **Force push**: Update the remote repository (be careful with this on shared repositories)
4. **Notify relevant parties**: If necessary, inform security teams or affected users

Example of removing sensitive files from Git history:

```bash
# Using BFG (recommended)
bfg --delete-files .env

# Or using git-filter-branch (more complex)
git filter-branch --force --index-filter \
  "git rm --cached --ignore-unmatch .env" \
  --prune-empty --tag-name-filter cat -- --all
```

### 5. Best Practices for Deployment

For deployment platforms:

- **Render/Vercel/Netlify**: Set environment variables through their dashboards
- **Docker**: Use Docker secrets or environment files that aren't committed
- **CI/CD**: Use secure variables in your CI/CD pipeline (e.g., GitHub Secrets, GitLab CI/CD Variables)

## Conclusion

Properly managing environment variables is crucial for maintaining the security of your application. By following these guidelines, you can prevent sensitive information from being exposed through your Git repository.
