#!/bin/bash
# Pre-deployment verification script

set -e

echo "🔍 TosmTracker Deployment Check"
echo "================================"
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

ERRORS=0

# Check 1: .env file exists
echo -n "Checking .env file... "
if [ -f ".env" ]; then
    echo -e "${GREEN}✓${NC}"
else
    echo -e "${RED}✗${NC} Missing .env file"
    ERRORS=$((ERRORS+1))
fi

# Check 2: Required environment variables
echo -n "Checking DATABASE_URL... "
if grep -q "DATABASE_URL=" .env 2>/dev/null; then
    if grep "DATABASE_URL=.*localhost" .env >/dev/null; then
        echo -e "${YELLOW}⚠${NC} Using localhost (ok for local dev)"
    else
        echo -e "${GREEN}✓${NC}"
    fi
else
    echo -e "${RED}✗${NC} Missing DATABASE_URL"
    ERRORS=$((ERRORS+1))
fi

echo -n "Checking JWT_SECRET... "
if grep -q "JWT_SECRET=" .env 2>/dev/null; then
    if grep "JWT_SECRET=.*chickenhamsterHEHE" .env >/dev/null || grep "JWT_SECRET=.*change-this" .env >/dev/null; then
        echo -e "${RED}✗${NC} Using default JWT_SECRET (INSECURE!)"
        ERRORS=$((ERRORS+1))
    else
        echo -e "${GREEN}✓${NC}"
    fi
else
    echo -e "${RED}✗${NC} Missing JWT_SECRET"
    ERRORS=$((ERRORS+1))
fi

echo -n "Checking CORS_ORIGIN... "
if grep -q "CORS_ORIGIN=" .env 2>/dev/null; then
    echo -e "${GREEN}✓${NC}"
else
    echo -e "${YELLOW}⚠${NC} Missing CORS_ORIGIN (will default to *)"
fi

# Check 3: Node.js version
echo -n "Checking Node.js version... "
if command -v node &> /dev/null; then
    NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
    if [ "$NODE_VERSION" -ge 18 ]; then
        echo -e "${GREEN}✓${NC} ($(node -v))"
    else
        echo -e "${RED}✗${NC} Need Node.js 18+ (found $(node -v))"
        ERRORS=$((ERRORS+1))
    fi
else
    echo -e "${YELLOW}⚠${NC} Node.js not found (ok if using Docker)"
fi

# Check 4: Docker
echo -n "Checking Docker... "
if command -v docker &> /dev/null; then
    echo -e "${GREEN}✓${NC} ($(docker --version))"
else
    echo -e "${YELLOW}⚠${NC} Docker not found"
fi

# Check 5: Dependencies
echo -n "Checking backend dependencies... "
if [ -d "node_modules" ]; then
    echo -e "${GREEN}✓${NC}"
else
    echo -e "${YELLOW}⚠${NC} Run 'npm install'"
fi

echo -n "Checking frontend dependencies... "
if [ -d "tracker-frontend/node_modules" ]; then
    echo -e "${GREEN}✓${NC}"
else
    echo -e "${YELLOW}⚠${NC} Run 'cd tracker-frontend && npm install'"
fi

# Check 6: Prisma client
echo -n "Checking Prisma client... "
if [ -d "node_modules/@prisma/client" ]; then
    echo -e "${GREEN}✓${NC}"
else
    echo -e "${YELLOW}⚠${NC} Run 'npx prisma generate'"
fi

# Check 7: .dockerignore
echo -n "Checking .dockerignore... "
if [ -f ".dockerignore" ]; then
    echo -e "${GREEN}✓${NC}"
else
    echo -e "${YELLOW}⚠${NC} Missing .dockerignore"
fi

# Check 8: Git status
echo -n "Checking git status... "
if command -v git &> /dev/null; then
    if git rev-parse --git-dir > /dev/null 2>&1; then
        UNCOMMITTED=$(git status --porcelain | wc -l)
        if [ "$UNCOMMITTED" -eq 0 ]; then
            echo -e "${GREEN}✓${NC} Clean"
        else
            echo -e "${YELLOW}⚠${NC} $UNCOMMITTED uncommitted changes"
        fi
    else
        echo -e "${YELLOW}⚠${NC} Not a git repository"
    fi
else
    echo -e "${YELLOW}⚠${NC} Git not found"
fi

echo ""
echo "================================"
if [ $ERRORS -eq 0 ]; then
    echo -e "${GREEN}✓ Ready to deploy!${NC}"
    exit 0
else
    echo -e "${RED}✗ $ERRORS error(s) found. Fix them before deploying.${NC}"
    exit 1
fi
