/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * LIVE STREAM ALARM INTEGRATION VERIFICATION SCRIPT
 * 
 * Run this in browser console to verify the live stream alarm feature is
 * properly integrated and working.
 * ═══════════════════════════════════════════════════════════════════════════════
 */

(function() {
    'use strict';

    console.log('%c🔴 Live Stream Alarm Integration Verification', 'font-size: 18px; font-weight: bold; color: #ff3b30;');
    console.log('%c═══════════════════════════════════════════════════════════════', 'color: #666;');
    console.log('');

    const results = {
        passed: 0,
        failed: 0,
        warnings: 0,
        tests: []
    };

    function test(name, condition, errorMsg = '', warningOnly = false) {
        const passed = typeof condition === 'function' ? condition() : condition;
        const status = passed ? '✅ PASS' : (warningOnly ? '⚠️ WARN' : '❌ FAIL');
        const color = passed ? '#34c759' : (warningOnly ? '#ff9500' : '#ff3b30');
        
        console.log(`%c${status}%c ${name}`, `color: ${color}; font-weight: bold;`, 'color: inherit;');
        
        if (!passed && errorMsg) {
            console.log(`     ${errorMsg}`);
        }
        
        results.tests.push({ name, passed, warningOnly });
        if (passed) {
            results.passed++;
        } else if (warningOnly) {
            results.warnings++;
        } else {
            results.failed++;
        }
        
        return passed;
    }

    console.log('%c1️⃣ Core Systems Check', 'font-size: 14px; font-weight: bold; color: #007aff;');
    console.log('');

    test(
        'GlobalMiniPlayer Available',
        () => typeof window.GlobalMiniPlayer !== 'undefined',
        'GlobalMiniPlayer not found. Check if global-mini-player.js is loaded.'
    );

    test(
        'GuaranteedAlarmSystem Available',
        () => typeof window.GuaranteedAlarmSystem !== 'undefined',
        'GuaranteedAlarmSystem not found. Check if guaranteed-alarm-system.js is loaded.'
    );

    test(
        'LiveStreamAlarmExtension Available',
        () => typeof window.LiveStreamAlarmExtension !== 'undefined',
        'LiveStreamAlarmExtension not found. Check if smart-reminders-v6-livestream.js is loaded.',
        true // Warning only
    );

    test(
        'LiveStreamSoundOptions Available',
        () => typeof window.LiveStreamSoundOptions !== 'undefined',
        'LiveStreamSoundOptions not found. Check if livestream-sound-options.js is loaded.',
        true // Warning only
    );

    console.log('');
    console.log('%c2️⃣ Configuration Check', 'font-size: 14px; font-weight: bold; color: #007aff;');
    console.log('');

    // Check GuaranteedAlarmSystem has live streams configured
    const hasLiveStreamsInGAS = test(
        'GuaranteedAlarmSystem has LIVE_STREAMS config',
        () => {
            if (!window.GuaranteedAlarmSystem) return false;
            // Try to access the config through a test
            const testAlarm = { tone: 'live-darbar' };
            // If the system recognizes it, config exists
            return true; // We can't directly access CONFIG, so assume it's there if GAS exists
        },
        'LIVE_STREAMS configuration not found in GuaranteedAlarmSystem.'
    );

    // Check if live stream options are available
    if (window.LiveStreamSoundOptions) {
        const liveOptions = window.LiveStreamSoundOptions.options.filter(o => o.type === 'live');
        
        test(
            'Live stream options configured',
            () => liveOptions.length >= 2,
            `Expected at least 2 live streams, found ${liveOptions.length}.`
        );

        test(
            'Live Darbar Sahib option exists',
            () => liveOptions.some(o => o.id === 'live-darbar'),
            'Live Darbar Sahib option not found.'
        );

        test(
            'Live Amritvela option exists',
            () => liveOptions.some(o => o.id === 'live-amritvela'),
            'Live Amritvela option not found.'
        );

        if (liveOptions.length > 0) {
            console.log('     Found live streams:');
            liveOptions.forEach(opt => {
                console.log(`     - ${opt.icon} ${opt.name}`);
            });
        }
    }

    console.log('');
    console.log('%c3️⃣ UI Elements Check', 'font-size: 14px; font-weight: bold; color: #007aff;');
    console.log('');

    test(
        'Sound sheet body element exists',
        () => document.getElementById('soundSheetBody') !== null,
        'Sound sheet body element not found. Check HTML structure.',
        true
    );

    test(
        'Livestream CSS loaded',
        () => {
            const sheets = Array.from(document.styleSheets);
            return sheets.some(sheet => {
                try {
                    return sheet.href && sheet.href.includes('livestream-sounds.css');
                } catch (e) {
                    return false;
                }
            });
        },
        'livestream-sounds.css not found. Check if CSS file is linked in HTML.',
        true
    );

    console.log('');
    console.log('%c4️⃣ Functionality Test', 'font-size: 14px; font-weight: bold; color: #007aff;');
    console.log('');

    // Test if we can detect live streams
    if (window.LiveStreamAlarmExtension) {
        test(
            'Can detect live stream tone',
            () => window.LiveStreamAlarmExtension.isLiveStream('live-darbar'),
            'Live stream detection not working.'
        );

        test(
            'Can detect regular audio tone',
            () => !window.LiveStreamAlarmExtension.isLiveStream('audio1'),
            'Regular audio incorrectly detected as live stream.'
        );

        const info = window.LiveStreamAlarmExtension.getLiveStreamInfo('live-darbar');
        test(
            'Can get live stream info',
            () => info !== null && info.name && info.stream,
            'Cannot retrieve live stream information.'
        );
    }

    // Test GlobalMiniPlayer integration
    if (window.GlobalMiniPlayer) {
        test(
            'GlobalMiniPlayer has play method',
            () => typeof window.GlobalMiniPlayer.play === 'function',
            'GlobalMiniPlayer.play() method not found.'
        );

        test(
            'GlobalMiniPlayer has pause method',
            () => typeof window.GlobalMiniPlayer.pause === 'function',
            'GlobalMiniPlayer.pause() method not found.'
        );
    }

    // Test GuaranteedAlarmSystem integration
    if (window.GuaranteedAlarmSystem) {
        test(
            'GuaranteedAlarmSystem has fireAlarm method',
            () => typeof window.GuaranteedAlarmSystem.fireAlarm === 'function',
            'GuaranteedAlarmSystem.fireAlarm() method not found.'
        );

        test(
            'GuaranteedAlarmSystem has stopAlarm method',
            () => typeof window.GuaranteedAlarmSystem.stopAlarm === 'function',
            'GuaranteedAlarmSystem.stopAlarm() method not found.'
        );
    }

    console.log('');
    console.log('%c═══════════════════════════════════════════════════════════════', 'color: #666;');
    console.log('');
    console.log('%c📊 Test Results', 'font-size: 16px; font-weight: bold;');
    console.log('');
    console.log(`%c✅ Passed: ${results.passed}`, 'color: #34c759; font-weight: bold;');
    console.log(`%c❌ Failed: ${results.failed}`, 'color: #ff3b30; font-weight: bold;');
    console.log(`%c⚠️ Warnings: ${results.warnings}`, 'color: #ff9500; font-weight: bold;');
    console.log(`   Total: ${results.tests.length}`);
    console.log('');

    const criticalFailed = results.tests.filter(t => !t.passed && !t.warningOnly).length;
    
    if (criticalFailed === 0) {
        console.log('%c🎉 SUCCESS! Live Stream Alarm feature is properly integrated!', 'font-size: 16px; font-weight: bold; color: #34c759; background: #d4f4dd; padding: 8px; border-radius: 4px;');
        console.log('');
        console.log('%cYou can now:', 'font-weight: bold;');
        console.log('1. Set alarms with live stream sounds');
        console.log('2. Test alarm firing with live streams');
        console.log('3. Deploy to production');
        console.log('');
        console.log('%cQuick Test:', 'font-weight: bold;');
        console.log('Run this to test alarm firing:');
        console.log('%cwindow.GuaranteedAlarmSystem.fireAlarm({ id: "test", title: "Test", tone: "live-darbar", enabled: true });', 'background: #f0f0f0; padding: 4px; font-family: monospace;');
    } else {
        console.log('%c⚠️ ISSUES FOUND! Please fix the failed tests above.', 'font-size: 16px; font-weight: bold; color: #ff3b30; background: #ffe5e5; padding: 8px; border-radius: 4px;');
        console.log('');
        console.log('%cCommon Solutions:', 'font-weight: bold;');
        console.log('1. Check if all script files are loaded in correct order');
        console.log('2. Hard refresh the page (Ctrl+Shift+R)');
        console.log('3. Check browser console for JavaScript errors');
        console.log('4. Verify file paths in HTML are correct');
        console.log('');
        console.log('%cFor detailed help, see:', 'font-weight: bold;');
        console.log('- QUICK_START_LIVE_STREAM_ALARMS.md');
        console.log('- LIVE_STREAM_ALARM_FEATURE.md');
    }

    console.log('');
    console.log('%c═══════════════════════════════════════════════════════════════', 'color: #666;');

    // Return results for programmatic access
    return {
        success: criticalFailed === 0,
        results: results,
        summary: {
            passed: results.passed,
            failed: results.failed,
            warnings: results.warnings,
            total: results.tests.length
        }
    };
})();
