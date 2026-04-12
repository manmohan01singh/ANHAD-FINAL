import Foundation
import WidgetKit

/**
 * WidgetDataBridge - Shared data bridge for iOS Widgets
 * Uses App Groups to share data between app and widgets
 */
class WidgetDataBridge {
    static let shared = WidgetDataBridge()
    
    // App Group identifier - must match entitlements
    private let suiteName = "group.com.gurbaniradio.app"
    
    private var defaults: UserDefaults? {
        return UserDefaults(suiteName: suiteName)
    }
    
    // MARK: - Data Sync
    
    func syncWidgetData(widgetType: String, data: [String: Any]) {
        guard let defaults = defaults else {
            print("[WidgetBridge] App Groups not configured")
            return
        }
        
        defaults.set(data, forKey: "widget_\(widgetType)")
        defaults.set(Date().timeIntervalSince1970, forKey: "widget_\(widgetType)_updated")
        defaults.synchronize()
        
        // Reload widget timeline
        WidgetCenter.shared.reloadTimelines(ofKind: widgetType)
        
        print("[WidgetBridge] Synced \(widgetType) widget")
    }
    
    func getWidgetData(widgetType: String) -> [String: Any]? {
        guard let defaults = defaults else { return nil }
        return defaults.dictionary(forKey: "widget_\(widgetType)")
    }
    
    func getLastUpdated(widgetType: String) -> Date? {
        guard let defaults = defaults else { return nil }
        let timestamp = defaults.double(forKey: "widget_\(widgetType)_updated")
        guard timestamp > 0 else { return nil }
        return Date(timeIntervalSince1970: timestamp)
    }
    
    // MARK: - Widget Types
    
    func syncAllWidgets() {
        WidgetCenter.shared.reloadAllTimelines()
    }
    
    // MARK: - Helper Methods
    
    func getString(_ key: String, from data: [String: Any]?, defaultValue: String = "") -> String {
        return data?[key] as? String ?? defaultValue
    }
    
    func getInt(_ key: String, from data: [String: Any]?, defaultValue: Int = 0) -> Int {
        return data?[key] as? Int ?? defaultValue
    }
    
    func getBool(_ key: String, from data: [String: Any]?, defaultValue: Bool = false) -> Bool {
        return data?[key] as? Bool ?? defaultValue
    }
    
    func getArray(_ key: String, from data: [String: Any]?) -> [Any]? {
        return data?[key] as? [Any]
    }
}

// MARK: - Widget Data Models

struct NitnemWidgetData {
    let streak: Int
    let progress: Int
    let completedBanis: Int
    let totalBanis: Int
    let isDark: Bool
    
    init(from data: [String: Any]?) {
        self.streak = data?["streak"] as? Int ?? 0
        self.progress = data?["progress"] as? Int ?? 0
        self.completedBanis = data?["completedBanis"] as? Int ?? 0
        self.totalBanis = data?["totalBanis"] as? Int ?? 5
        self.isDark = data?["isDark"] as? Bool ?? true
    }
}

struct NaamAbhyasWidgetData {
    let streak: Int
    let completedHours: Int
    let totalHours: Int
    let remainingHours: Int
    let percentage: Int
    let enabled: Bool
    let nextReminder: String
    let isDark: Bool
    
    init(from data: [String: Any]?) {
        self.streak = data?["streak"] as? Int ?? 0
        self.completedHours = data?["completedHours"] as? Int ?? 0
        self.totalHours = data?["totalHours"] as? Int ?? 17
        self.remainingHours = data?["remainingHours"] as? Int ?? 17
        self.percentage = data?["percentage"] as? Int ?? 0
        self.enabled = data?["enabled"] as? Bool ?? false
        self.nextReminder = data?["nextReminder"] as? String ?? ""
        self.isDark = data?["isDark"] as? Bool ?? true
    }
}

struct CalendarWidgetData {
    let nextEventName: String
    let daysUntil: Int
    let hukamnamaPreview: String
    let nanakshahiDate: String
    let isDark: Bool
    
    init(from data: [String: Any]?) {
        self.nextEventName = data?["nextEventName"] as? String ?? "No upcoming events"
        self.daysUntil = data?["daysUntil"] as? Int ?? -1
        self.hukamnamaPreview = data?["hukamnamaPreview"] as? String ?? ""
        self.nanakshahiDate = data?["nanakshahiDate"] as? String ?? ""
        self.isDark = data?["isDark"] as? Bool ?? true
    }
}

struct KirtanWidgetData {
    let trackName: String
    let stationName: String
    let isPlaying: Bool
    let duration: String
    let isDark: Bool
    
    init(from data: [String: Any]?) {
        self.trackName = data?["trackName"] as? String ?? "Not Playing"
        self.stationName = data?["stationName"] as? String ?? "Select Station"
        self.isPlaying = data?["isPlaying"] as? Bool ?? false
        self.duration = data?["duration"] as? String ?? ""
        self.isDark = data?["isDark"] as? Bool ?? true
    }
}
