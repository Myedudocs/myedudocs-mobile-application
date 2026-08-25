/**
 * Localization helpers for English → Hindi.
 *
 * These mirror the regex maps used by the web's
 * `student-dashboards/pages/Dashboard/DashboardIndex.tsx` and
 * `student-dashboards/pages/Notifications/NotificationsListV2.tsx` so the mobile
 * app renders the same translated strings as the web for activity items,
 * relative-time chips and notification titles.
 */

/**
 * Translate a recent-activity title or description into Hindi.
 *
 * Web reference:
 *   `DashboardIndex.tsx::localizeActivityText`
 */
export const localizeActivityText = (text: string, isHindi: boolean): string => {
  if (!text || !isHindi) return text;
  let res = text;
  // Titles
  res = res.replace(/^Test Attempt/i, 'टेस्ट प्रयास');
  res = res.replace(/^Library Update/i, 'लाइब्रेरी अपडेट');
  res = res.replace(/^Saved for Later/i, 'बाद के लिए सहेजा गया');
  res = res.replace(/^Course Progress/i, 'कोर्स प्रगति');
  res = res.replace(/^Enrolled in Course/i, 'कोर्स में नामांकित');
  res = res.replace(/^Reward Earned/i, 'रिवार्ड अर्जित किया');
  res = res.replace(/^Points Earned/i, 'अंक अर्जित किए');
  // Descriptions
  res = res.replace(/Recent effort in /i, 'हालिया प्रयास: ');
  res = res.replace(/New book added to your digital collection/i, 'आपकी डिजिटल लाइब्रेरी में नई पुस्तक जोड़ी गई');
  res = res.replace(/to your wishlist/i, 'आपकी इच्छासूची में');
  res = res.replace(/^Added\s*"?/i, 'जोड़ा गया "');
  res = res.replace(/Coins credited\s*-\s*Coins earned for approved blog/i, 'कॉइन्स खाते में जोड़े गए - स्वीकृत ब्लॉग के लिए अर्जित');
  res = res.replace(/Coins credited/i, 'कॉइन्स खाते में जोड़े गए');
  res = res.replace(/Coins earned for approved blog/i, 'स्वीकृत ब्लॉग के लिए अर्जित');
  return res;
};

/**
 * Translate a relative-time string ("2 hours ago", "yesterday", …) into Hindi.
 *
 * Web reference:
 *   `DashboardIndex.tsx::localizeRelativeTime`
 */
export const localizeRelativeTime = (timeStr: string, isHindi: boolean): string => {
  if (!timeStr || !isHindi) return timeStr;
  let res = timeStr;
  res = res.replace(/just now/i, 'अभी');
  res = res.replace(/yesterday/i, 'कल');
  res = res.replace(/(\d+)\s+seconds?\s+ago/i, '$1 सेकंड पहले');
  res = res.replace(/(\d+)\s+minutes?\s+ago/i, '$1 मिनट पहले');
  res = res.replace(/(\d+)\s+hours?\s+ago/i, '$1 घंटे पहले');
  res = res.replace(/(\d+)\s+days?\s+ago/i, '$1 दिन पहले');
  res = res.replace(/(\d+)\s+weeks?\s+ago/i, '$1 सप्ताह पहले');
  res = res.replace(/(\d+)\s+months?\s+ago/i, '$1 महीने पहले');
  res = res.replace(/(\d+)\s+years?\s+ago/i, '$1 वर्ष पहले');
  return res;
};

/**
 * Translate a notification title into Hindi.
 *
 * Web reference:
 *   `NotificationsListV2.tsx::localizeNotificationTitle`
 */
export const localizeNotificationTitle = (
  title: string,
  isHindi: boolean
): string => {
  if (!title || !isHindi) return title;
  let res = title;
  res = res.replace(/Test Submitted Successfully!?/i, 'टेस्ट सफलतापूर्वक जमा किया गया!');
  res = res.replace(/New Job Alert!?/i, 'नई नौकरी अलर्ट!');
  res = res.replace(/Course Enrolled Successfully!?/i, 'कोर्स में सफल नामांकन!');
  res = res.replace(/Book Purchased Successfully!?/i, 'पुस्तक सफलतापूर्वक खरीदी गई!');
  res = res.replace(/Test Series Enrolled Successfully!?/i, 'टेस्ट सीरीज़ में सफल नामांकन!');
  res = res.replace(/Live Class Reminder!?/i, 'लाइव क्लास अनुस्मारक!');
  res = res.replace(/Exam Scheduled!?/i, 'परीक्षा निर्धारित!');
  res = res.replace(/New Result Published!?/i, 'नया परिणाम प्रकाशित!');
  res = res.replace(/Coupon Assigned!?/i, 'नया कूपन उपलब्ध!');
  res = res.replace(/Ticket Status Updated!?/i, 'सहायता टिकट स्थिति अपडेट!');
  return res;
};

/**
 * Translate a notification message body into Hindi.
 *
 * Web reference:
 *   `NotificationsListV2.tsx::localizeNotificationMessage`
 */
export const localizeNotificationMessage = (
  msg: string,
  isHindi: boolean
): string => {
  if (!msg || !isHindi) return msg;
  let res = msg;
  res = res.replace(
    /You have successfully submitted your attempt for\s*"?([^".]+)"?\./i,
    'आपने "$1" के लिए अपना टेस्ट सफलतापूर्वक जमा कर दिया है।'
  );
  res = res.replace(/Score:\s*([\d\/\.\%]+)\s*\(([\d\.\%]+)\)\./i, 'स्कोर: $1 ($2),');
  res = res.replace(/Accuracy:\s*([\d\.\%]+)\./i, 'सटीकता: $1.');
  return res;
};

/**
 * Translate a notification category label (Course, Book, Result, …) into Hindi.
 *
 * Web reference:
 *   `NotificationsListV2.tsx::localizeNotificationLabel`
 */
export const localizeNotificationLabel = (
  label: string,
  isHindi: boolean
): string => {
  if (!label || !isHindi) return label;
  const map: Record<string, string> = {
    Course: 'कोर्स',
    Content: 'कंटेंट',
    'Course Enrolled': 'कोर्स नामांकन',
    Book: 'पुस्तक',
    'Book Purchased': 'पुस्तक खरीद',
    'Test Series': 'टेस्ट सीरीज़',
    'Test Series Enrolled': 'टेस्ट सीरीज़ नामांकन',
    Exam: 'परीक्षा',
    'Live Session': 'लाइव क्लास',
    Syllabus: 'पाठ्यक्रम',
    PYQ: 'पीवाईक्यू',
    'Job Alert': 'नौकरी अलर्ट',
    Result: 'परिणाम',
    Coupon: 'कूपन',
    Support: 'सहायता',
    Update: 'अपडेट',
  };
  return map[label] || label;
};