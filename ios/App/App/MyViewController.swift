import UIKit
import Capacitor

class MyViewController: CAPBridgeViewController {
    override open func viewDidLoad() {
        super.viewDidLoad()                       // bridge is created here
        NSLog("[MyVC] registering AppIconPlugin")
        bridge?.registerPluginInstance(AppIconPlugin())
    }
}
