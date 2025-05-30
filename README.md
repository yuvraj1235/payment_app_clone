# Welcome to your Expo app 👋

This is an [Expo](https://expo.dev) project created with [`create-expo-app`](https://www.npmjs.com/package/create-expo-app).

## Get started

1. Install dependencies

   ```bash
   npm install
   ```

2. Start the app

   ```bash
   npx expo start
   ```

In the output, you'll find options to open the app in a

- [development build](https://docs.expo.dev/develop/development-builds/introduction/)
- [Android emulator](https://docs.expo.dev/workflow/android-studio-emulator/)
- [iOS simulator](https://docs.expo.dev/workflow/ios-simulator/)
- [Expo Go](https://expo.dev/go), a limited sandbox for trying out app development with Expo

You can start developing by editing the files inside the **app** directory. This project uses [file-based routing](https://docs.expo.dev/router/introduction).

## Get a fresh project

When you're ready, run:

```bash
npm run reset-project
```

This command will move the starter code to the **app-example** directory and create a blank **app** directory where you can start developing.

## Learn more

To learn more about developing your project with Expo, look at the following resources:

- [Expo documentation](https://docs.expo.dev/): Learn fundamentals, or go into advanced topics with our [guides](https://docs.expo.dev/guides).
- [Learn Expo tutorial](https://docs.expo.dev/tutorial/introduction/): Follow a step-by-step tutorial where you'll create a project that runs on Android, iOS, and the web.

## Join the community

Join our community of developers creating universal apps.

- [Expo on GitHub](https://github.com/expo/expo): View our open source platform and contribute.
- [Discord community](https://chat.expo.dev): Chat with Expo users and ask questions.
# payment_app_clone
Secure Mobile Payment Application
This application provides a secure and intuitive platform for mobile payments, leveraging React Native for a seamless cross-platform experience and Firebase for robust backend services. Users can efficiently manage their balances and facilitate transactions through a user-friendly interface.

Key Features:

User Authentication & Profile Management: Securely log in and manage your personal user profile.

Balance Management: View your current balance in real-time, updated via Firestore listeners.

QR Code Scanning for Payments: Initiate payments quickly by scanning a recipient's unique QR code. The app extracts the recipient's Firebase User ID (UID) from the QR code.

Recipient Details Fetching: Upon scanning, the payment screen intelligently fetches and displays the recipient's username and email from Firestore using their UID, ensuring you know who you're paying.

Numeric Keypad for Amount Entry: An integrated, custom numeric keypad allows for precise and easy input of payment amounts.

Secure Transactions: All payment operations are handled through Firestore Transactions, guaranteeing atomicity (either both sender's debit and recipient's credit succeed, or both fail) for financial integrity.

Real-time Updates: Firebase's real-time capabilities ensure that balances and transaction statuses are promptly reflected across the application.

Camera Permission Handling: Robust handling of camera permissions ensures a smooth and secure QR scanning experience.

Flashlight Toggle: Easily toggle your device's flashlight within the camera view for scanning in low-light conditions.

This application is designed with security and user experience at its core, making mobile payments straightforward and reliable.

