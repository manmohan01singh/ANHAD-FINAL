import sys
sys.stdout.reconfigure(encoding='utf-8')

from playwright.sync_api import sync_playwright
import os

with sync_playwright() as p:
    print("Launching Chrome for error tracking...")
    browser = p.chromium.launch(
        headless=True,
        executable_path=r"C:\Program Files (x86)\Google\Chrome\Application\chrome.exe"
    )
    
    def test_url(url, action_selector=None):
        print(f"\n--- Testing URL: {url} ---")
        context = browser.new_context(viewport={"width": 430, "height": 920})
        page = context.new_page()
        
        console_logs = []
        page.on("console", lambda msg: console_logs.append(f"[{msg.type}] {msg.text}"))
        
        failed_requests = []
        page.on("requestfailed", lambda request: failed_requests.append(f"Failed request: {request.url} - {request.failure}"))
        page.on("response", lambda response: (
            failed_requests.append(f"Response error: {response.status} {response.url}") if response.status >= 400 else None
        ))
        
        try:
            page.goto(url, wait_until="load", timeout=5000)
            page.wait_for_timeout(1000)
            
            if action_selector:
                print(f"Clicking element: {action_selector}")
                page.click(action_selector)
                page.wait_for_timeout(1000)
                print(f"Destination URL: {page.url}")
                
        except Exception as e:
            print(f"Error during navigation/click: {e}")
            
        print("Console Logs:")
        for log in console_logs:
            print(f"  {log}")
            
        print("Failed/Error Requests:")
        for req in failed_requests:
            print(f"  {req}")
            
        context.close()

    # Test 1: Load Gurbani Khoj
    test_url("http://localhost:8000/GurbaniKhoj/gurbani-khoj.html")
    
    # Test 2: Click menu from Gurbani Khoj
    test_url("http://localhost:8000/GurbaniKhoj/gurbani-khoj.html", "#menuBtn")
    
    # Test 3: Click notification from Gurbani Khoj
    test_url("http://localhost:8000/GurbaniKhoj/gurbani-khoj.html", "#notificationBtn")
    
    # Test 4: Click Bookmarks from Gurbani Khoj
    test_url("http://localhost:8000/GurbaniKhoj/gurbani-khoj.html", "#tabBookmarks")
    
    # Test 5: Click Recent from Gurbani Khoj
    test_url("http://localhost:8000/GurbaniKhoj/gurbani-khoj.html", "#tabMore")
    
    # Test 6: Load Favorites directly
    test_url("http://localhost:8000/Favorites/favorites.html")
    
    # Test 7: Load History directly
    test_url("http://localhost:8000/GurbaniKhoj/search-history.html")
    
    browser.close()
    print("\nError tracking completed!")
