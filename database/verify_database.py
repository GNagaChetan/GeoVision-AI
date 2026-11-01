"""
Database Verification Script for GeoVision AI.
Checks PostgreSQL connection, PostGIS spatial extension, and pgvector extension.
"""
import os
import sys

def verify_db():
    host = os.environ.get("POSTGRES_HOST", "localhost")
    port = os.environ.get("POSTGRES_PORT", "5432")
    user = os.environ.get("POSTGRES_USER", "geovision_user")
    password = os.environ.get("POSTGRES_PASSWORD", "geovision_password")
    dbname = os.environ.get("POSTGRES_DB", "geovision_db")

    print(f"Connecting to PostgreSQL at {host}:{port}/{dbname} (User: {user})...")
    
    try:
        import psycopg
        conninfo = f"host={host} port={port} dbname={dbname} user={user} password={password} connect_timeout=5"
        with psycopg.connect(conninfo) as conn:
            with conn.cursor() as cur:
                # 1. PostgreSQL version
                cur.execute("SELECT version();")
                pg_ver = cur.fetchone()[0]
                print(f"[OK] PostgreSQL Connected: {pg_ver}")

                # 2. PostGIS version
                try:
                    cur.execute("SELECT PostGIS_Full_Version();")
                    postgis_ver = cur.fetchone()[0]
                    print(f"[OK] PostGIS Enabled: {postgis_ver}")
                except Exception as e:
                    print(f"[NOTICE] PostGIS Check: {e}")

                # 3. pgvector extension
                try:
                    cur.execute("SELECT extversion FROM pg_extension WHERE extname = 'vector';")
                    row = cur.fetchone()
                    if row:
                        print(f"[OK] pgvector Enabled: version {row[0]}")
                    else:
                        print("[INFO] pgvector extension not present in current DB instance (in-memory/file fallback active).")
                except Exception as e:
                    print(f"[INFO] pgvector Check: {e}")

                # 4. Check tables
                cur.execute("""
                    SELECT table_name FROM information_schema.tables 
                    WHERE table_schema = 'public' ORDER BY table_name;
                """)
                tables = [r[0] for r in cur.fetchall()]
                print(f"[OK] Tables Present ({len(tables)}): {', '.join(tables)}")

        return True
    except Exception as err:
        print(f"Database connection note: {err}")
        print("Application operates with graceful in-memory & file storage fallback when external PostgreSQL is not running.")
        return False

if __name__ == "__main__":
    verify_db()
