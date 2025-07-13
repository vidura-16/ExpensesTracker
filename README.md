# 💸 ExpensesTracker

A simple and clean mobile app to track your daily expenses, built with **React Native** and **Expo**.

---

## ✨ Features

- ✅ Track expenses by category (Food, Travel, Utilities, Extra)
- 📊 View weekly and monthly summaries
- 🔔 Get alerts when you exceed your daily budget
- 📁 Works fully offline (no server required)
- 📱 Runs as a standalone app on iOS

---

## 📦 Tech Stack

- ⚛️ React Native (with Expo)
- 📱 Native iOS via Xcode
- 📊 Charts via [react-native-chart-kit] or similar
- 🧠 Local Storage (AsyncStorage)

---------------

## 🚀 Getting Started

### 1. Clone the repo
bash
git clone https://github.com/vidura-16/ExpensesTracker.git
cd ExpensesTracker

2. Install dependencies

yarn install

3. Run on simulator

npx expo start
Press i to launch iOS simulator.

==================

📱 Install to iPhone (Standalone Native App)
  Run:
    npx expo prebuild
    cd ios
    pod install
    cd ..
    open ios/*.xcworkspace

  In Xcode:
    Connect iPhone via USB
    Select device
    Set signing team and bundle ID
    Build and install (Cmd + R)

✅ App will now run natively without Expo Go or dev server.

🛠️ Planned Features

   Daily spending goals with AI tips

👨‍💻 Author

Built with ❤️ by Vidura Vishwa
