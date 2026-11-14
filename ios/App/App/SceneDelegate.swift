import UIKit
import Capacitor

class SceneDelegate: UIResponder, UIWindowSceneDelegate {
    var window: UIWindow?

    func scene(_ scene: UIScene, willConnectTo session: UISceneSession, options connectionOptions: UIScene.ConnectionOptions) {
        guard let windowScene = scene as? UIWindowScene else { return }

        let container = UIViewController()
        container.view.backgroundColor = UIColor(red: 243 / 255, green: 247 / 255, blue: 245 / 255, alpha: 1)

        let bridge = CAPBridgeViewController()
        container.addChild(bridge)
        bridge.view.translatesAutoresizingMaskIntoConstraints = false
        container.view.addSubview(bridge.view)
        let safeArea = container.view.safeAreaLayoutGuide
        NSLayoutConstraint.activate([
            bridge.view.topAnchor.constraint(equalTo: safeArea.topAnchor),
            bridge.view.bottomAnchor.constraint(equalTo: safeArea.bottomAnchor),
            bridge.view.leadingAnchor.constraint(equalTo: safeArea.leadingAnchor),
            bridge.view.trailingAnchor.constraint(equalTo: safeArea.trailingAnchor),
        ])
        bridge.didMove(toParent: container)

        window = UIWindow(windowScene: windowScene)
        window?.rootViewController = container
        window?.makeKeyAndVisible()

        SceneDelegateProxy.shared.scene(scene, willConnectTo: session, options: connectionOptions)
    }

    func scene(_ scene: UIScene, openURLContexts URLContexts: Set<UIOpenURLContext>) {
        SceneDelegateProxy.shared.scene(scene, openURLContexts: URLContexts)
    }

    func scene(_ scene: UIScene, continue userActivity: NSUserActivity) {
        SceneDelegateProxy.shared.scene(scene, continue: userActivity)
    }
}
