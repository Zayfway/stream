import Foundation
import Capacitor
import UIKit

/// Switches between the bundled alternate app icons (one per theme).
@objc(AppIconPlugin)
public class AppIconPlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "AppIconPlugin"
    public let jsName = "AppIcon"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "change", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "current", returnType: CAPPluginReturnPromise)
    ]

    @objc func change(_ call: CAPPluginCall) {
        let name = call.getString("name") // nil = primary icon
        NSLog("[AppIcon] change -> %@ (supports=%d, current=%@)", name ?? "nil", UIApplication.shared.supportsAlternateIcons ? 1 : 0, UIApplication.shared.alternateIconName ?? "nil")
        DispatchQueue.main.async {
            guard UIApplication.shared.supportsAlternateIcons else { call.reject("unsupported"); return }
            if UIApplication.shared.alternateIconName == name { call.resolve(); return } // no-op, no system alert
            UIApplication.shared.setAlternateIconName(name) { error in
                if let error = error { NSLog("[AppIcon] error: %@", error.localizedDescription); call.reject(error.localizedDescription) } else { NSLog("[AppIcon] switched to %@", name ?? "primary"); call.resolve() }
            }
        }
    }

    @objc func current(_ call: CAPPluginCall) {
        DispatchQueue.main.async { call.resolve(["name": UIApplication.shared.alternateIconName as Any]) }
    }
}
