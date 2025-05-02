# Detailed GitHub Repository Setup Guide

## Step 1: Create a New Repository

1. Sign in to your GitHub account at https://github.com
2. Click on the "+" icon in the top-right corner, then select "New repository"
3. Fill in the repository details:
   - Owner: your GitHub username
   - Repository name: LOCKDOWN-Escape-Room
   - Description: A web-based escape room 3D interactive application built with Three.js
   - Choose whether it should be Public or Private
   - **Important**: Do NOT check "Add a README file", "Add .gitignore", or "Choose a license"
4. Click "Create repository"

## Step 2: Connect Your Local Repository

After creating the repository, GitHub will show you a page with setup instructions. Follow the "push an existing repository" section.

In your terminal, where you've already initialized your Git repository, run:

```
git remote add origin https://github.com/YOUR_USERNAME/LOCKDOWN-Escape-Room.git
git branch -M main
git push -u origin main
```

Replace "YOUR_USERNAME" with your actual GitHub username.

## Step 3: Authentication

When you push to GitHub, you'll need to authenticate. If you're prompted for credentials:

1. For username: enter your GitHub username
2. For password: use a personal access token (PAT), not your regular password

**Note**: If you haven't created a PAT, follow these steps:
1. Go to GitHub Settings → Developer settings → Personal access tokens → Tokens (classic)
2. Click "Generate new token"
3. Give it a name, set an expiration, and select the "repo" scope
4. Click "Generate token" and copy the token immediately
5. Use this token as your password when pushing to GitHub

## Step 4: Verify Your Repository

After successfully pushing your code, visit:
https://github.com/YOUR_USERNAME/LOCKDOWN-Escape-Room

You should see all your files there.

## Step 5: Enable GitHub Pages (Optional)

To make your project viewable as a website:

1. Go to your repository on GitHub
2. Click "Settings"
3. Scroll down to "Pages" in the left sidebar
4. Under "Source", select "Deploy from a branch"
5. Select "main" branch and "/(root)" folder
6. Click "Save"
7. After a few minutes, your site will be published at:
   https://YOUR_USERNAME.github.io/LOCKDOWN-Escape-Room/ 