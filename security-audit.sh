#!/bin/bash

echo "🔍 Security Audit - Brainstorm AI Grouper"
echo "=========================================="
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

ISSUES=0

# Check 1: .env file
echo "1. Checking .env file..."
if [ -f ".env" ]; then
    if grep -q "YOUR_API_KEY_HERE\|PLACEHOLDER\|your_actual" .env; then
        echo -e "${GREEN}   ✓ .env contains placeholder values (safe)${NC}"
    else
        if grep -q "AIza" .env; then
            echo -e "${RED}   ✗ .env contains what appears to be a real API key!${NC}"
            echo -e "${RED}     ACTION REQUIRED: Replace with placeholder before committing${NC}"
            ISSUES=$((ISSUES + 1))
        else
            echo -e "${YELLOW}   ⚠ .env exists - verify it doesn't contain real secrets${NC}"
        fi
    fi
else
    echo -e "${GREEN}   ✓ .env file not found (good for security)${NC}"
fi

# Check 2: .gitignore
echo ""
echo "2. Checking .gitignore..."
if [ -f ".gitignore" ]; then
    if grep -q "^.env$" .gitignore && grep -q "backend/.env" .gitignore; then
        echo -e "${GREEN}   ✓ .env files are in .gitignore${NC}"
    else
        echo -e "${RED}   ✗ .env files not properly ignored in .gitignore${NC}"
        ISSUES=$((ISSUES + 1))
    fi
else
    echo -e "${RED}   ✗ .gitignore file not found${NC}"
    ISSUES=$((ISSUES + 1))
fi

# Check 3: Hardcoded secrets in code
echo ""
echo "3. Scanning for hardcoded secrets..."
SECRETS_FOUND=$(grep -r -i "AIza[0-9A-Za-z-_]\{35\}" --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx" . 2>/dev/null | grep -v "node_modules" | grep -v ".git" | wc -l)
if [ "$SECRETS_FOUND" -gt 0 ]; then
    echo -e "${RED}   ✗ Found $SECRETS_FOUND potential API keys in code!${NC}"
    echo -e "${RED}     Run: grep -r \"AIza\" --include=\"*.ts\" --include=\"*.js\" .${NC}"
    ISSUES=$((ISSUES + 1))
else
    echo -e "${GREEN}   ✓ No API keys found in source code${NC}"
fi

# Check 4: docker-compose.yml
echo ""
echo "4. Checking docker-compose.yml..."
if [ -f "docker-compose.yml" ]; then
    if grep -q "127.0.0.1:5016" docker-compose.yml; then
        echo -e "${GREEN}   ✓ Port binding restricted to localhost${NC}"
    else
        if grep -q "5016:5016" docker-compose.yml; then
            echo -e "${YELLOW}   ⚠ Port 5016 exposed to all interfaces${NC}"
            echo -e "${YELLOW}     Recommendation: Change to 127.0.0.1:5016:5016${NC}"
        fi
    fi
    
    if grep -q "API_KEY=\${API_KEY}" docker-compose.yml || grep -q "env_file:" docker-compose.yml; then
        echo -e "${GREEN}   ✓ API_KEY loaded from environment${NC}"
    else
        if grep -q "API_KEY=[^$]" docker-compose.yml; then
            echo -e "${RED}   ✗ API_KEY appears to be hardcoded in docker-compose.yml${NC}"
            ISSUES=$((ISSUES + 1))
        fi
    fi
else
    echo -e "${YELLOW}   ⚠ docker-compose.yml not found${NC}"
fi

# Check 5: Default passwords
echo ""
echo "5. Checking for default passwords..."
if grep -r "admin1234\|password123\|defaultpassword" --include="*.ts" --include="*.js" . 2>/dev/null | grep -v "node_modules" | grep -v "SECURITY.md" | grep -v "DEPLOYMENT.md" | grep -q .; then
    echo -e "${RED}   ✗ Found default passwords in code${NC}"
    ISSUES=$((ISSUES + 1))
else
    echo -e "${GREEN}   ✓ No obvious default passwords found${NC}"
fi

# Check 6: SSL/HTTPS readiness
echo ""
echo "6. Checking production readiness..."
if [ -f "SECURITY.md" ] && [ -f "DEPLOYMENT.md" ]; then
    echo -e "${GREEN}   ✓ Security and deployment documentation present${NC}"
else
    echo -e "${YELLOW}   ⚠ Missing security documentation${NC}"
fi

# Final report
echo ""
echo "=========================================="
if [ $ISSUES -eq 0 ]; then
    echo -e "${GREEN}✓ Security audit passed! No critical issues found.${NC}"
    echo ""
    echo "Before deploying to production:"
    echo "  1. Review SECURITY.md for best practices"
    echo "  2. Follow DEPLOYMENT.md for secure deployment"
    echo "  3. Ensure API_KEY is set only on the server"
    echo "  4. Use HTTPS with valid SSL certificate"
    exit 0
else
    echo -e "${RED}✗ Found $ISSUES security issue(s) that need attention!${NC}"
    echo ""
    echo "Please fix the issues above before deploying."
    exit 1
fi
