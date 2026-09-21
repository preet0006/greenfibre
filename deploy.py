"""
GreenFibre VPS Deployment Pipeline Script
Usage: python deploy.py
"""
import sys
import os
import tarfile
import paramiko

# Configure stdout/stderr encoding to UTF-8 for Windows command prompt compatibility
sys.stdout.reconfigure(encoding='utf-8')
sys.stderr.reconfigure(encoding='utf-8')

# --- CONFIGURATION ---
SSH_HOST = os.environ.get('VPS_HOST', '72.61.250.120')
SSH_PORT = int(os.environ.get('VPS_PORT', 22))
SSH_USER = os.environ.get('VPS_USER', 'root')
SSH_PASS = os.environ.get('VPS_PASS', 'Root@#1234567')

LOCAL_DIR = os.path.dirname(os.path.abspath(__file__))
LOCAL_SRC_DIR = os.path.join(LOCAL_DIR, "src")
LOCAL_ARCHIVE = os.path.join(LOCAL_DIR, "deploy_pack.tar.gz")

REMOTE_TARGET_DIR = '/var/www/greenfibre/src'
REMOTE_ARCHIVE_PATH = '/root/deploy_pack.tar.gz'

def should_exclude(path):
    normalized = path.replace('\\', '/')
    parts = normalized.split('/')
    
    # Exclude development artifact directories
    exclude_dirs = {'node_modules', '.next', '.git', '.idea', '.vscode', 'out', 'dist'}
    for p in parts:
        if p in exclude_dirs:
            return True
            
    # Do not upload local configuration/environment files
    filename = os.path.basename(path)
    if filename.startswith('.env') or filename == '.env':
        return True
        
    return False

def make_tarfile(output_filename, source_dir):
    print("📦 Packing local changes...")
    count = 0
    with tarfile.open(output_filename, "w:gz") as tar:
        for root, dirs, files in os.walk(source_dir):
            for file in files:
                full_path = os.path.join(root, file)
                if should_exclude(full_path):
                    continue
                
                # Strip the 'src' prefix so it unpacks directly into green-api, green-main, etc.
                rel_path = os.path.relpath(full_path, source_dir)
                tar.add(full_path, arcname=rel_path)
                count += 1
    print(f"✨ Created archive with {count} files.")

def run_ssh_command(ssh, cmd, description):
    print(f"🚀 Running: {description}...")
    stdin, stdout, stderr = ssh.exec_command(cmd)
    
    # Wait for completion
    exit_status = stdout.channel.recv_exit_status()
    out = stdout.read().decode('utf-8', errors='ignore')
    err = stderr.read().decode('utf-8', errors='ignore')
    
    if exit_status != 0:
        print(f"❌ Error during: {description} (Exit status: {exit_status})")
        if out:
            print("--- STDOUT ---")
            print(out)
        if err:
            print("--- STDERR ---")
            print(err)
        sys.exit(1)
    else:
        print(f"✅ Success: {description}")
        return out

def main():
    if not os.path.exists(LOCAL_SRC_DIR):
        print(f"❌ Source directory not found at: {LOCAL_SRC_DIR}")
        sys.exit(1)

    # 1. Create tar archive
    make_tarfile(LOCAL_ARCHIVE, LOCAL_SRC_DIR)

    try:
        # 2. Upload to VPS
        print(f"🔌 Connecting to VPS {SSH_HOST} via SFTP...")
        transport = paramiko.Transport((SSH_HOST, SSH_PORT))
        transport.connect(username=SSH_USER, password=SSH_PASS)
        sftp = paramiko.SFTPClient.from_transport(transport)
        
        print("📤 Uploading package to VPS...")
        sftp.put(LOCAL_ARCHIVE, REMOTE_ARCHIVE_PATH)
        sftp.close()
        transport.close()
        
        # 3. SSH commands execution
        print(f"🔌 Connecting to VPS {SSH_HOST} via SSH...")
        ssh = paramiko.SSHClient()
        ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
        ssh.connect(SSH_HOST, port=SSH_PORT, username=SSH_USER, password=SSH_PASS)
        
        # Backup environment files to be absolutely safe
        run_ssh_command(
            ssh, 
            "mkdir -p /root/env_backups && "
            "cp /var/www/greenfibre/src/backend/.env /root/env_backups/backend.env 2>/dev/null || true && "
            "cp /var/www/greenfibre/src/frontend/main/.env.production /root/env_backups/main.env 2>/dev/null || true && "
            "cp /var/www/greenfibre/src/frontend/admin/.env.production /root/env_backups/admin.env 2>/dev/null || true",
            "Backing up remote env files"
        )
        
        # Ensure target directory exists
        run_ssh_command(
            ssh,
            f"mkdir -p {REMOTE_TARGET_DIR}",
            "Creating remote target directory"
        )
        
        # Extract target code archive
        run_ssh_command(
            ssh,
            f"tar -xzf {REMOTE_ARCHIVE_PATH} -C {REMOTE_TARGET_DIR}",
            "Extracting codebase on VPS"
        )
        
        # Clean remote archive file
        run_ssh_command(
            ssh,
            f"rm {REMOTE_ARCHIVE_PATH}",
            "Cleaning up remote archive"
        )
        
        # Restore environment files in case anything got overwritten
        run_ssh_command(
            ssh,
            "cp /root/env_backups/backend.env /var/www/greenfibre/src/backend/.env 2>/dev/null || true && "
            "cp /root/env_backups/main.env /var/www/greenfibre/src/frontend/main/.env.production 2>/dev/null || true && "
            "cp /root/env_backups/admin.env /var/www/greenfibre/src/frontend/admin/.env.production 2>/dev/null || true",
            "Restoring env files"
        )
        
        # Update and restart Backend
        run_ssh_command(
            ssh,
            "cd /var/www/greenfibre/src/backend && npm install && "
            "(pm2 restart greenfibre-api || pm2 start src/index.js --name greenfibre-api)",
            "Installing Backend dependencies and starting/restarting PM2 process"
        )
        
        # Update, build, and restart Admin Dashboard
        run_ssh_command(
            ssh,
            "cd /var/www/greenfibre/src/frontend/admin && npm install && npm run build && "
            "(pm2 restart greenfibre-admin || pm2 start npm --name greenfibre-admin -- start)",
            "Installing Admin dependencies, building dashboard, and starting/restarting PM2 process"
        )
        
        # Update, build, and restart Main Storefront
        run_ssh_command(
            ssh,
            "cd /var/www/greenfibre/src/frontend/main && npm install && npm run build && "
            "(pm2 restart greenfibre-main || pm2 start npm --name greenfibre-main -- start)",
            "Installing Main storefront dependencies, building storefront Next.js app, and starting/restarting PM2 process"
        )
        
        # Also clean up the duplicate /root/Greenfiber processes if they exist
        run_ssh_command(
            ssh,
            "pm2 delete green-api green-admin green-main 2>/dev/null || true",
            "Cleaning up duplicate PM2 processes"
        )
        
        # Show final PM2 status
        status = run_ssh_command(ssh, "pm2 list", "Fetching final PM2 status")
        print("\n🏆 --- DEPLOYMENT COMPLETED SUCCESSFULLY --- 🏆")
        print(status)
        
        ssh.close()
        
    except Exception as e:
        print(f"❌ Deployment failed with error: {e}")
        sys.exit(1)
        
    finally:
        # Clean up local archive
        if os.path.exists(LOCAL_ARCHIVE):
            os.remove(LOCAL_ARCHIVE)

if __name__ == "__main__":
    main()
