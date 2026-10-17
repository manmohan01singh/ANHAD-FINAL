import { describe, it, expect, beforeEach, vi } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('BaniCacheOptimizer - Path Resolution & Chunk Fetching', () => {
    const optimizerCodePath = path.resolve(__dirname, '../../frontend/lib/bani-cache-optimizer.js');
    let optimizerCode = '';

    beforeEach(() => {
        optimizerCode = fs.readFileSync(optimizerCodePath, 'utf-8');
    });

    it('implements getChunksBaseUrl with robust multi-depth path calculation', () => {
        expect(optimizerCode).toContain('getChunksBaseUrl()');
        expect(optimizerCode).toContain("path.includes('/nitnem/category/')");
        expect(optimizerCode).toContain('../../data/banis-chunks/');
        expect(optimizerCode).toContain("path.includes('/nitnem/')");
        expect(optimizerCode).toContain('../data/banis-chunks/');
    });

    it('implements fetchChunkFile trying candidate URLs to eliminate 404s', () => {
        expect(optimizerCode).toContain('async fetchChunkFile(filename)');
        expect(optimizerCode).toContain('../data/banis-chunks/${filename}');
        expect(optimizerCode).toContain('/data/banis-chunks/${filename}');
        expect(optimizerCode).toContain('data/banis-chunks/${filename}');
    });

    it('resolves correct chunk URL when running from /nitnem/reader.html in browser simulation', () => {
        // Evaluate the optimizer in simulated environment
        delete window.BaniCacheOptimizer;
        delete window.baniCacheOptimizer;
        
        // Mock window.location for /nitnem/reader.html
        delete window.location;
        window.location = {
            pathname: '/nitnem/reader.html',
            origin: 'http://localhost:3004',
            href: 'http://localhost:3004/nitnem/reader.html'
        };

        // Mock IndexedDB
        window.indexedDB = {
            open: () => ({
                onerror: () => {},
                onsuccess: () => {},
                onupgradeneeded: () => {}
            })
        };

        // Execute code
        const evalFn = new Function(optimizerCode);
        evalFn();

        expect(window.BaniCacheOptimizer).toBeDefined();
        const instance = new window.BaniCacheOptimizer();
        const baseUrl = instance.getChunksBaseUrl();

        // From /nitnem/reader.html, the base URL must point up one level to reach /data/banis-chunks/
        expect(baseUrl).toBe('../data/banis-chunks/');
    });

    it('resolves correct chunk URL when running from root /index.html in browser simulation', () => {
        delete window.BaniCacheOptimizer;
        delete window.baniCacheOptimizer;

        window.location = {
            pathname: '/index.html',
            origin: 'http://localhost:3004',
            href: 'http://localhost:3004/index.html'
        };

        const evalFn = new Function(optimizerCode);
        evalFn();

        const instance = new window.BaniCacheOptimizer();
        const baseUrl = instance.getChunksBaseUrl();

        expect(baseUrl).toBe('data/banis-chunks/');
    });

    it('resolves correct chunk URL when running from deep /nitnem/category/evening.html in browser simulation', () => {
        delete window.BaniCacheOptimizer;
        delete window.baniCacheOptimizer;

        window.location = {
            pathname: '/nitnem/category/evening.html',
            origin: 'http://localhost:3004',
            href: 'http://localhost:3004/nitnem/category/evening.html'
        };

        const evalFn = new Function(optimizerCode);
        evalFn();

        const instance = new window.BaniCacheOptimizer();
        const baseUrl = instance.getChunksBaseUrl();

        expect(baseUrl).toBe('../../data/banis-chunks/');
    });
});
