import WidgetKit
import SwiftUI

// MARK: - Timeline Entry

struct NaamAbhyasEntry: TimelineEntry {
    let date: Date
    let data: NaamAbhyasWidgetData
}

// MARK: - Timeline Provider

struct NaamAbhyasProvider: TimelineProvider {
    func placeholder(in context: Context) -> NaamAbhyasEntry {
        NaamAbhyasEntry(date: Date(), data: NaamAbhyasWidgetData(from: nil))
    }
    
    func getSnapshot(in context: Context, completion: @escaping (NaamAbhyasEntry) -> Void) {
        let data = WidgetDataBridge.shared.getWidgetData(widgetType: "naamabhyas")
        let entry = NaamAbhyasEntry(date: Date(), data: NaamAbhyasWidgetData(from: data))
        completion(entry)
    }
    
    func getTimeline(in context: Context, completion: @escaping (Timeline<NaamAbhyasEntry>) -> Void) {
        let data = WidgetDataBridge.shared.getWidgetData(widgetType: "naamabhyas")
        let entry = NaamAbhyasEntry(date: Date(), data: NaamAbhyasWidgetData(from: data))
        
        // Update every 15 minutes
        let nextUpdate = Calendar.current.date(byAdding: .minute, value: 15, to: Date())!
        let timeline = Timeline(entries: [entry], policy: .after(nextUpdate))
        completion(timeline)
    }
}

// MARK: - Widget Views

struct NaamAbhyasWidgetView: View {
    var entry: NaamAbhyasProvider.Entry
    @Environment(\.widgetFamily) var family
    
    var body: some View {
        switch family {
        case .systemSmall:
            SmallNaamAbhyasView(data: entry.data)
        case .systemMedium:
            MediumNaamAbhyasView(data: entry.data)
        default:
            SmallNaamAbhyasView(data: entry.data)
        }
    }
}

struct SmallNaamAbhyasView: View {
    let data: NaamAbhyasWidgetData
    
    var body: some View {
        VStack(spacing: 8) {
            // Header
            HStack(spacing: 4) {
                Text("🙏")
                    .font(.title3)
                Text("Naam Abhyas")
                    .font(.caption.bold())
                    .foregroundColor(data.isDark ? .white : .black)
            }
            
            // Streak
            Text(data.streak > 0 ? "🔥 \(data.streak)" : "Start today")
                .font(.caption)
                .foregroundColor(data.isDark ? .white.opacity(0.7) : .black.opacity(0.7))
            
            if data.enabled {
                // Progress circle
                ZStack {
                    Circle()
                        .stroke(Color.white.opacity(0.2), lineWidth: 4)
                        .frame(width: 50, height: 50)
                    
                    Circle()
                        .trim(from: 0, to: CGFloat(data.percentage) / 100)
                        .stroke(LinearGradient(
                            gradient: Gradient(colors: [Color.orange, Color.orange.opacity(0.8)]),
                            startPoint: .top,
                            endPoint: .bottom
                        ), style: StrokeStyle(lineWidth: 4, lineCap: .round))
                        .frame(width: 50, height: 50)
                        .rotationEffect(.degrees(-90))
                    
                    Text("\(data.percentage)%")
                        .font(.caption.bold())
                        .foregroundColor(data.isDark ? .white : .black)
                }
                
                // Stats
                HStack {
                    Text("\(data.completedHours) done")
                        .font(.caption2)
                        .foregroundColor(.green)
                    Text("•")
                        .font(.caption2)
                        .foregroundColor(data.isDark ? .white.opacity(0.5) : .black.opacity(0.5))
                    Text("\(data.remainingHours) left")
                        .font(.caption2)
                        .foregroundColor(.orange)
                }
            } else {
                Text("Tap to enable")
                    .font(.caption)
                    .foregroundColor(.red)
                    .padding(.top, 8)
            }
        }
        .padding()
        .containerBackground(data.isDark ? Color.black.gradient : Color.white.gradient, for: .widget)
    }
}

struct MediumNaamAbhyasView: View {
    let data: NaamAbhyasWidgetData
    
    var body: some View {
        HStack(spacing: 16) {
            // Left: Icon and title
            VStack(alignment: .leading, spacing: 8) {
                HStack(spacing: 8) {
                    Text("🙏")
                        .font(.title2)
                    Text("Naam Abhyas")
                        .font(.headline.bold())
                        .foregroundColor(data.isDark ? .white : .black)
                }
                
                Text(data.streak > 0 ? "🔥 \(data.streak) day streak" : "🙏 Start your streak today")
                    .font(.subheadline)
                    .foregroundColor(data.isDark ? .white.opacity(0.7) : .black.opacity(0.7))
                
                if !data.nextReminder.isEmpty && data.enabled {
                    Text("Next: \(data.nextReminder)")
                        .font(.caption)
                        .foregroundColor(.orange)
                        .padding(.top, 4)
                }
            }
            
            Spacer()
            
            // Right: Progress
            if data.enabled {
                VStack(spacing: 8) {
                    // Progress circle
                    ZStack {
                        Circle()
                            .stroke(Color.white.opacity(0.2), lineWidth: 6)
                            .frame(width: 70, height: 70)
                        
                        Circle()
                            .trim(from: 0, to: CGFloat(data.percentage) / 100)
                            .stroke(LinearGradient(
                                gradient: Gradient(colors: [Color.orange, Color.orange.opacity(0.8)]),
                                startPoint: .top,
                                endPoint: .bottom
                            ), style: StrokeStyle(lineWidth: 6, lineCap: .round))
                            .frame(width: 70, height: 70)
                            .rotationEffect(.degrees(-90))
                        
                        Text("\(data.percentage)%")
                            .font(.subheadline.bold())
                            .foregroundColor(data.isDark ? .white : .black)
                    }
                    
                    // Stats
                    HStack(spacing: 12) {
                        VStack(spacing: 2) {
                            Text("\(data.completedHours)")
                                .font(.title3.bold())
                                .foregroundColor(.green)
                            Text("Done")
                                .font(.caption2)
                                .foregroundColor(data.isDark ? .white.opacity(0.7) : .black.opacity(0.7))
                        }
                        
                        VStack(spacing: 2) {
                            Text("\(data.remainingHours)")
                                .font(.title3.bold())
                                .foregroundColor(.orange)
                            Text("Left")
                                .font(.caption2)
                                .foregroundColor(data.isDark ? .white.opacity(0.7) : .black.opacity(0.7))
                        }
                    }
                }
            } else {
                VStack {
                    Text("OFF")
                        .font(.title2.bold())
                        .foregroundColor(.red)
                    Text("Tap to enable reminders")
                        .font(.caption)
                        .foregroundColor(data.isDark ? .white.opacity(0.7) : .black.opacity(0.7))
                }
            }
        }
        .padding()
        .containerBackground(data.isDark ? Color.black.gradient : Color.white.gradient, for: .widget)
    }
}

// MARK: - Widget Configuration

struct NaamAbhyasWidget: Widget {
    let kind: String = "naamabhyas"
    
    var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: NaamAbhyasProvider()) { entry in
            NaamAbhyasWidgetView(entry: entry)
        }
        .configurationDisplayName("Naam Abhyas")
        .description("Hourly Vaheguru remembrance reminders")
        .supportedFamilies([.systemSmall, .systemMedium])
    }
}
