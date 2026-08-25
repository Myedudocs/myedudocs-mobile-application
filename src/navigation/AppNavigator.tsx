import React from "react";
import { View, StyleSheet } from "react-native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { useAuth } from "../context/AuthContext";
import { MainTabNavigator } from "./MainTabNavigator";

// --- IMPORT SCREENS ---
import { Home } from "../screens/home/Home";
import { Profile } from "../screens/profile/MyProfile";
import { MyCourses } from "../screens/MyCourses/MyCourses";
import { CourseLearning } from "../screens/MyCourses/MyCourseLearning";
import { Courses } from "../screens/Courses/Courses";
import { CourseDetails } from "../screens/Courses/CoursesDetails";
import { Books } from "../screens/Books/Books";
import { BookDetails } from "../screens/Books/BookDetails";
import { MyWishlist } from "../screens/Wishlist/MyWishlist";
import { Cart } from '../screens/Books/MyBooksCart';
import { BooksCheckout } from "../screens/Books/BooksCheckout";
import { OverallGrowth } from "../screens/TestSeries/OverallGrowth";
import { MyTestSeries } from "../screens/TestSeries/Testseries";
import { TestSeriesDetails } from "../screens/TestSeries/TestSeriesDetails";
import { ViewTest } from "../screens/TestSeries/ViewTest";
import { BlogDetails } from "../screens/Blogs/BlogDetails";
import { Blogs } from "../screens/Blogs/Blogs";
import { EditProfile } from "../screens/profile/EditProfile";
import { PaymentHistory } from "../screens/Payments/PaymentHistory";
import { PaymentDetails } from "../screens/Payments/PaymentDetails";
import { JobNotifications } from "../screens/Jobs/JobNotifications";
import { JobDetails } from "../screens/Jobs/JobDetails";
import { PreviousPapers } from "../screens/PYQs/PYQs";
import { PYQDetails } from "../screens/PYQs/PYQDetails";
import { CoinHistory } from "../screens/Blogs/CoinHistory";
import { SplashScreen } from "../screens/Splash/SplashScreen";
import { AllTestSeries } from "../screens/TestSeries/AllTestSeries";
import { TestSeriesBrowse } from "../screens/TestSeries/TestSeriesBrowse";
import { TestSeriesHierarchy } from "../screens/TestSeries/TestSeriesHierarchy";
import { Syllabus } from "../screens/syllabus/Syllabus";
import { FreeResources } from "../screens/home/FreeResources";
import { Error404 } from "../screens/home/Error404";
import { Exams } from "../screens/home/Exams";
import { CategoryWiseExams } from "../screens/home/CategoryWiseExams";
import { ExamDetails } from "../screens/home/ExamDetails";
import { ExamsPage } from "../screens/home/ExamsPage";

// --- AUTH SCREENS ---
import { Login } from "../screens/Auth/Login"; 
import { Register } from "../screens/Auth/Register";
import { PublishBlogs } from "../screens/Blogs/PublishBlogs";
import { TestInterface } from "../screens/TestSeries/TestSeriesInterface";
import { TestResults } from "../screens/TestSeries/TestResults";
import { MyPurchasedBooks } from "../screens/Books/MyPurchasedBooks";
import { PdfViewer } from "../screens/Books/PdfViewer";
import { LiveClasses } from "../screens/Liveclasses/LiveClasses";
import { ForgotPassword } from "../screens/Auth/ForgotPassword";
import { CurrentAffairs } from "../screens/CurrentAffairs/CurrentAffairs";
import { CurrentAffairsDetails } from "../screens/CurrentAffairs/CurrentAffairsDetails";
import { SupportTickets } from "../screens/Support/SupportTickets";
import { CreateTicket } from "../screens/Support/CreateTicket";
import { TicketChat } from "../screens/Support/TicketChat";
import { ContactSupport } from "../screens/Support/ContactSupport";

// --- NEW STUDENT DASHBOARD & CHATBOT SCREENS ---
import { StudentDashboard } from "../screens/StudentDashboard/StudentDashboard";
import { StudentMetricsScreen } from "../screens/StudentDashboard/StudentMetricsScreen";
import { LeaderboardScreen } from "../screens/Leaderboard/LeaderboardScreen";
import { RewardsScreen } from "../screens/Rewards/RewardsScreen";
import { NotificationsScreen } from "../screens/Notifications/NotificationsScreen";
import { DeviceManagementScreen } from "../screens/Settings/DeviceManagementScreen";
import { SettingsScreen } from "../screens/Settings/SettingsScreen";
import { AchievementsScreen } from "../screens/Achievements/AchievementsScreen";
import { MyLearningHubScreen } from "../screens/MyLearning/MyLearningHubScreen";
import { LiveChatWidget } from "../components/chat/LiveChatWidget";

// --- v2 NEW SCREENS ---
import { CouponsScreen } from "../screens/Coupons/CouponsScreen";
import { WalletScreen } from "../screens/Coupons/WalletScreen";
import { PurchaseHistoryScreen } from "../screens/Purchases/PurchaseHistoryScreen";
import { ExamsListScreen } from "../screens/Exams/ExamsListScreen";
import { ResultsListScreen } from "../screens/Results/ResultsListScreen";
import { ResultDetailScreen } from "../screens/Results/ResultDetailScreen";

import { RootStackParamList } from "./types";
import MainDrawer from "./MainDrawer";

const Stack = createNativeStackNavigator<RootStackParamList>();

const AppNavigator = () => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="SplashScreen" component={SplashScreen} />
      </Stack.Navigator>
    );
  }

  return (
    <View style={styles.appContainer}>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {user == null ? (
          // --- LOGGED OUT: AUTH SCREENS ---
          <Stack.Group>
            <Stack.Screen name="Login" component={Login} />
            <Stack.Screen name="Register" component={Register} />
            <Stack.Screen name="ForgotPassword" component={ForgotPassword} />
          </Stack.Group>
        ) : (
          // --- LOGGED IN: STUDENT PORTAL ---
          <Stack.Group>
            <Stack.Screen name="MainTabs" component={MainDrawer} />
            <Stack.Screen name="StudentDashboard" component={StudentDashboard} />
            <Stack.Screen name="StudentMetrics" component={StudentMetricsScreen} />
            <Stack.Screen name="Leaderboard" component={LeaderboardScreen} />
            <Stack.Screen name="Rewards" component={RewardsScreen} />
            <Stack.Screen name="Notifications" component={NotificationsScreen} />
            <Stack.Screen name="DeviceManagement" component={DeviceManagementScreen} />
            <Stack.Screen name="Settings" component={SettingsScreen} />
            <Stack.Screen name="Achievements" component={AchievementsScreen} />
            <Stack.Screen name="MyLearningHub" component={MyLearningHubScreen} />

            {/* Standard Catalogs & Detail Screens */}
            <Stack.Screen name="Home" component={Home} />
            <Stack.Screen name="Profile" component={Profile} />
            <Stack.Screen name="MyCourses" component={MyCourses} />
            <Stack.Screen name="CourseLearning" component={CourseLearning} />
            <Stack.Screen name="Courses" component={Courses} />
            <Stack.Screen name="CourseDetails" component={CourseDetails} />
            <Stack.Screen name="Books" component={Books} />
            <Stack.Screen name="BookDetails" component={BookDetails} />
            <Stack.Screen name="MyWishlist" component={MyWishlist} />
            <Stack.Screen name="Cart" component={Cart} />
            <Stack.Screen name="BooksCheckout" component={BooksCheckout} />
            <Stack.Screen name="OverallGrowth" component={OverallGrowth} />
            <Stack.Screen name="MyTestSeries" component={MyTestSeries} />
            <Stack.Screen name="TestSeriesDetails" component={TestSeriesDetails} />
            <Stack.Screen name="ViewTest" component={ViewTest} />
            <Stack.Screen name="Blogs" component={Blogs} />
            <Stack.Screen name="BlogDetails" component={BlogDetails} />
            <Stack.Screen name="EditProfile" component={EditProfile} />
            <Stack.Screen name="PaymentHistory" component={PaymentHistory} />
            <Stack.Screen name="PaymentDetails" component={PaymentDetails} />
            <Stack.Screen name="JobNotifications" component={JobNotifications} />
            <Stack.Screen name="JobDetails" component={JobDetails} />
            <Stack.Screen name="PreviousPapers" component={PreviousPapers} />
            <Stack.Screen name="PYQDetails" component={PYQDetails} />
            <Stack.Screen name="CoinHistory" component={CoinHistory} />
            <Stack.Screen name="AllTestSeries" component={AllTestSeries} />
            <Stack.Screen name="TestSeriesBrowse" component={TestSeriesBrowse} />
            <Stack.Screen name="TestSeriesHierarchy" component={TestSeriesHierarchy} />
            <Stack.Screen name="Syllabus" component={Syllabus} />
            <Stack.Screen name="PublishBlogs" component={PublishBlogs} />
            <Stack.Screen name="TestInterface" component={TestInterface} />
            <Stack.Screen name="TestResults" component={TestResults} />
            <Stack.Screen name="MyPurchasedBooks" component={MyPurchasedBooks} />
            <Stack.Screen name="PdfViewer" component={PdfViewer} />
            <Stack.Screen name="LiveClasses" component={LiveClasses} />
            <Stack.Screen name="FreeResources" component={FreeResources} />
            <Stack.Screen name="CurrentAffairs" component={CurrentAffairs} />
            <Stack.Screen name="CurrentAffairsDetails" component={CurrentAffairsDetails} />
            <Stack.Screen name="SupportTickets" component={SupportTickets} />
            <Stack.Screen name="CreateTicket" component={CreateTicket} />
            <Stack.Screen name="TicketChat" component={TicketChat} />
            <Stack.Screen name="ContactSupport" component={ContactSupport} />
            <Stack.Screen name="Error404" component={Error404} />
            <Stack.Screen name="Exams" component={ExamsListScreen} />
            <Stack.Screen name="CategoryWiseExams" component={CategoryWiseExams} />
            <Stack.Screen name="ExamDetails" component={ExamDetails} />
            <Stack.Screen name="ExamsPage" component={ExamsPage} />

            {/* STUDENT v2 NEW SCREENS */}
            <Stack.Screen name="Coupons" component={CouponsScreen} />
            <Stack.Screen name="Wallet" component={WalletScreen} />
            <Stack.Screen name="PurchaseHistory" component={PurchaseHistoryScreen} />
            <Stack.Screen name="ExamsList" component={ExamsListScreen} />
            <Stack.Screen name="ResultsList" component={ResultsListScreen} />
            <Stack.Screen name="ResultDetail" component={ResultDetailScreen} />
          </Stack.Group>
        )}
      </Stack.Navigator>

      {/* Global Live Chatbot FAB for Logged In Students */}
      {user != null && <LiveChatWidget />}
    </View>
  );
};

const styles = StyleSheet.create({
  appContainer: {
    flex: 1,
  },
});

export default AppNavigator;