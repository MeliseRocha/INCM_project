 pkgs ? import <nixpkgs> {} }:

pkgs.dockerTools.buildImage {
  name = "stacy";
  tag = "latest";
  config = {
    Cmd = [ "/bin/entrypoint" ];
    WorkingDir = "/app";
    ExposedPorts = {
      "5000/tcp" = {};
      "8002/tcp" = {};
      "3000/tcp" = {};
    };
    Volumes = {
      "/app/database.db" = {}; # Persistent database file
    };
  };
  copyToRoot = pkgs.buildEnv {
    name = "server-environment";
    paths = [

      pkgs.sqlite
      pkgs.bash
      pkgs.coreutils
      pkgs.tzdata

      # Include Node.js and npm for React
      pkgs.nodejs

      # Certificates
      pkgs.cacert

      # Include the Python interpreter and dependencies
      (pkgs.python310.withPackages (ps: [
        ps.flask
        ps."flask-restful"
        ps."flask-jwt-extended"
        ps."flask-cors"
        ps.werkzeug
        ps.pytz
        ps.apscheduler
        ps."email-validator"
        ps.urllib3
      ]))

      # Include the entrypoint script
      (pkgs.writeShellScriptBin "entrypoint" ''
        #!/bin/sh
        set -e

        # Ensure /tmp exists with correct permissions
        mkdir -p /tmp
        chmod 1777 /tmp

        # Trust certificates for npm
        export NODE_EXTRA_CA_CERTS=/etc/ssl/certs/ca-certificates.crt

        # Disable npm strict SSL
        npm set strict-ssl false

        # Install and build React app
        cd /app/frontend
        npm install react react-dom react-scripts --save
        node node_modules/react-scripts/bin/react-scripts.js start &

        # Ensure database persistence
        if [ ! -f /app/database.db ]; then
          echo "Initializing database..."
          cp /app/database.db.template /app/database.db
        fi

        # Start Flask app
        exec python3 /app/app.py        git rm --cached stacy.tar
      '')

      # Include all files from the current directory
      (pkgs.runCommand "app-directory" {} ''
        mkdir -p $out/app
        cp -r ${./.}/* $out/app
        mv -f $out/app/database.db $out/app/database.db.template
      '')
    ];
  };
}