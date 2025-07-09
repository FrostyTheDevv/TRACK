import { ScraperManager } from '../src/services/scrapers/ScraperManager';

async function testScrapers() {
    console.log('🚀 Testing Stream Scrapers...\n');

    const scraperManager = new ScraperManager({
        enableKick: true,
        enableTikTok: true,
        scrapeInterval: 2,
        maxRetries: 2,
        timeout: 15000
    });

    try {
        await scraperManager.init();
        console.log('✅ Scrapers initialized successfully\n');

        // Test Kick scraper with a known streamer (you can change this)
        console.log('🎮 Testing Kick scraper...');
        const kickResult = await scraperManager.checkStreamStatus('kick', 'xqc');
        console.log('Kick Result:', JSON.stringify(kickResult, null, 2));

        // Test TikTok scraper with a known streamer (you can change this)
        console.log('\n📱 Testing TikTok scraper...');
        const tiktokResult = await scraperManager.checkStreamStatus('tiktok', 'charlidamelio');
        console.log('TikTok Result:', JSON.stringify(tiktokResult, null, 2));

        // Test multiple streams
        console.log('\n🔥 Testing multiple streams...');
        const multipleResults = await scraperManager.checkMultipleStreams([
            { platform: 'kick', username: 'adin' },
            { platform: 'tiktok', username: 'khaby.lame' }
        ]);
        console.log('Multiple Results:', JSON.stringify(multipleResults, null, 2));

        // Health check
        console.log('\n💚 Running health check...');
        const health = await scraperManager.healthCheck();
        console.log('Health Check:', JSON.stringify(health, null, 2));

    } catch (error) {
        console.error('❌ Error during testing:', error);
    } finally {
        await scraperManager.close();
        console.log('\n🔒 Scrapers closed successfully');
    }
}

if (require.main === module) {
    testScrapers().then(() => {
        console.log('\n✨ Test completed!');
        process.exit(0);
    }).catch((error) => {
        console.error('❌ Test failed:', error);
        process.exit(1);
    });
}
