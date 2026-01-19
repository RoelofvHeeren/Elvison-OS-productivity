import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    try {
        console.log('🔍 Checking ICP and Company counts...\n');

        // Check if companies table exists by trying to query it
        try {
            const totalCompanies = await prisma.$queryRaw`
                SELECT COUNT(*) as count FROM companies
            `;
            console.log('📊 Total Companies:', totalCompanies);
        } catch (e) {
            console.log('❌ Companies table not found in this database');
        }

        // Check ICPs
        try {
            const icps = await prisma.$queryRaw`
                SELECT id, name, type FROM icps
            `;
            console.log('\n📋 ICPs found:', icps);
        } catch (e) {
            console.log('❌ ICPs table not found');
        }

        // Check leads grouped by ICP
        try {
            const leadsByIcp = await prisma.$queryRaw`
                SELECT 
                    i.name as icp_name,
                    i.type as icp_type,
                    COUNT(DISTINCT l.id) as lead_count,
                    COUNT(DISTINCT l.company_id) as company_count
                FROM icps i
                LEFT JOIN leads l ON l.icp_id = i.id
                GROUP BY i.id, i.name, i.type
            `;
            console.log('\n📈 Leads by ICP:', leadsByIcp);
        } catch (e) {
            console.log('❌ Could not query leads by ICP:', e.message);
        }

        // Check companies with leads vs without
        try {
            const companiesWithLeads = await prisma.$queryRaw`
                SELECT COUNT(DISTINCT company_id) as count 
                FROM leads 
                WHERE company_id IS NOT NULL
            `;
            console.log('\n🏢 Companies with leads:', companiesWithLeads);

            const companiesWithoutLeads = await prisma.$queryRaw`
                SELECT COUNT(*) as count 
                FROM companies c
                WHERE NOT EXISTS (
                    SELECT 1 FROM leads l WHERE l.company_id = c.id
                )
            `;
            console.log('🏢 Companies without leads:', companiesWithoutLeads);
        } catch (e) {
            console.log('❌ Could not check company/lead relationship:', e.message);
        }

    } catch (error) {
        console.error('💥 Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

main();
