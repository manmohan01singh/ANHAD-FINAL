//
//  ANHADWidgets.swift
//  WidgetsExtension
//
//  iOS Home Screen Widgets Bundle for ANHAD App
//

import WidgetKit
import SwiftUI

@main
struct ANHADWidgets: WidgetBundle {
    var body: some Widget {
        // Register all widgets
        NitnemWidget()
        NaamAbhyasWidget()
        CalendarWidget()
        KirtanWidget()
    }
}
