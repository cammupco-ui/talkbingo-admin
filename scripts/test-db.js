const neo4j = require('neo4j-driver');
const fs = require('fs');
const path = require('path');

async function testConnection() {
    try {
        const envPath = path.resolve(process.cwd(), '.env.local');
        if (!fs.existsSync(envPath)) {
            console.error('.env.local file not found');
            process.exit(1);
        }

        const envContent = fs.readFileSync(envPath, 'utf8');
        const env = {};
        envContent.split('\n').forEach(line => {
            const match = line.match(/^([^=]+)=(.*)$/);
            if (match) {
                const key = match[1].trim();
                const value = match[2].trim().replace(/^['"]|['"]$/g, '');
                env[key] = value;
            }
        });

        const URI = env.NEO4J_URI;
        const USER = env.NEO4J_USERNAME;
        const PASSWORD = env.NEO4J_PASSWORD;

        if (!URI || !USER || !PASSWORD) {
            console.error('Missing Neo4j credentials in .env.local');
            process.exit(1);
        }

        console.log(`Testing connection to ${URI} as ${USER}...`);
        const driver = neo4j.driver(URI, neo4j.auth.basic(USER, PASSWORD));
        const session = driver.session();

        try {
            await session.executeRead(tx => tx.run('RETURN 1'));
            console.log('✅ Connection successful!');
        } finally {
            await session.close();
            await driver.close();
        }

    } catch (error) {
        console.error('❌ Connection failed:', error);
        process.exit(1);
    }
}

testConnection();
