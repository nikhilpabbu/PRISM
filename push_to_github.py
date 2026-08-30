import sys
import getpass
from dulwich import porcelain
from dulwich.repo import Repo

def push_repo(token=None):
    repo_path = '.'
    url = 'https://github.com/nikhilpabbu/PRISM.git'
    
    if not token:
        if len(sys.argv) > 1:
            token = sys.argv[1]
        else:
            print("=== PRISM GitHub Push Helper ===")
            print(f"Target Repository: {url}")
            print("\nPlease enter your GitHub Personal Access Token (PAT) with 'repo' permissions:")
            token = getpass.getpass("GitHub Token (hidden): ").strip()

    if not token:
        print("Error: No token provided.")
        return

    # Authenticated URL
    auth_url = f"https://oauth2:{token}@github.com/nikhilpabbu/PRISM.git"

    print("\nPushing main branch to GitHub...")
    try:
        repo = Repo(repo_path)
        repo[b'refs/heads/main'] = repo.head()
        porcelain.push(repo_path, auth_url, 'refs/heads/main:refs/heads/main')
        print("\n🎉 SUCCESS! All PRISM project files have been pushed to:")
        print(url)
    except Exception as e:
        print(f"\nPush failed: {e}")
        print("Tip: Make sure your GitHub token has 'repo' (read/write) access.")

if __name__ == "__main__":
    push_repo()
