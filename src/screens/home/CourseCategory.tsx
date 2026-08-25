import React from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity 
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { 
  GraduationCap, 
  Briefcase, 
  FileSignature, 
  FileQuestion,
  BookOpen, // Added for Syllabus
  History // Added for PYQs
} from 'lucide-react-native';
import { theme as staticTheme } from '../../styles/theme'; // Adjust path if necessary

// --------------------------------------------------------
// 1. REUSABLE SECTION HEADER
// --------------------------------------------------------
interface SectionHeaderProps {
  title: string;
  onSeeAll?: () => void;
}

export const SectionHeader: React.FC<SectionHeaderProps> = ({ title, onSeeAll }) => (
  <View style={styles.headerContainer}>
    <Text style={styles.sectionTitle}>{title}</Text>
    {/* <TouchableOpacity onPress={onSeeAll} activeOpacity={0.7}>
      <Text style={styles.seeAllText}>See all</Text>
    </TouchableOpacity> */}
  </View>
);

// --------------------------------------------------------
// 2. STATIC CATEGORY DATA WITH ROUTES
// --------------------------------------------------------
const CATEGORY_DATA = [
  { 
    id: '1', 
    title: 'Courses', 
    route: 'Courses', // Adjust this to match your actual screen name
    Icon: GraduationCap, 
    iconColor: '#2B64F5', // Blue
    bgTint: '#F2F6FE', 
    borderTint: '#E2EAFB' 
  },
  { 
    id: '2', 
    title: 'Jobs', 
    route: 'JobNotifications',
    Icon: Briefcase, 
    iconColor: '#E86A2B', // Orange
    bgTint: '#FFF8F2', 
    borderTint: '#FEEBDC' 
  },
  { 
    id: '3', 
    title: 'Test Series', // Replaced Banking
    route: 'TestSeries',
    Icon: FileQuestion, 
    iconColor: '#9747FF', // Purple
    bgTint: '#F8F3FF', 
    borderTint: '#EFE5FF' 
  },
  { 
    id: '4', 
    title: 'UPSC', 
    route: 'Courses', // Or route to a filtered UPSC screen
    Icon: FileSignature, 
    iconColor: '#1B9B5A', // Green
    bgTint: '#F0FCF5', 
    borderTint: '#DDF5E6' 
  },
  { 
    id: '5', 
    title: 'Syllabus', // New Field
    route: 'Syllabus', 
    Icon: BookOpen, 
    iconColor: '#E73554', // Red/Pink
    bgTint: '#FFF2F4', 
    borderTint: '#FEE2E7' 
  },
  { 
    id: '6', 
    title: 'PYQs', // New Field
    route: 'PreviousPapers', 
    Icon: History, 
    iconColor: '#0891B2', // Cyan/Teal
    bgTint: '#ECFEFF', 
    borderTint: '#CFFAFE' 
  },
];

// --------------------------------------------------------
// 3. MAIN COMPONENT
// --------------------------------------------------------
export const CourseCategories = React.memo(() => {
  const navigation = useNavigation<any>();

  return (
    <View style={styles.container}>
      <SectionHeader title="Categories" />
      
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {CATEGORY_DATA.map((item) => {
          const IconComponent = item.Icon;
          
          return (
            <TouchableOpacity 
              key={item.id} 
              style={styles.categoryItem}
              activeOpacity={0.8}
              onPress={() => navigation.navigate(item.route)} // Added Navigation
            >
              {/* The circular icon container with exact tints */}
              <View 
                style={[
                  styles.iconCircle, 
                  { 
                    backgroundColor: item.bgTint, 
                    borderColor: item.borderTint 
                  }
                ]}
              >
                {/* Dynamically rendering the Lucide Icon */}
                <IconComponent 
                  color={item.iconColor} 
                  size={26} 
                  strokeWidth={2} 
                />
              </View>
              
              {/* Category Label */}
              <Text style={styles.categoryTitle}>{item.title}</Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
});

// --------------------------------------------------------
// 4. EXACT STYLES (Unchanged)
// --------------------------------------------------------
const styles = StyleSheet.create({
  container: {
    marginTop: staticTheme.spacing.xl, 
    backgroundColor: staticTheme.colors.background,
  },
  
  // Header Styles
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: staticTheme.spacing.xl,
    marginBottom: 20, 
  },
  sectionTitle: {
    fontSize: 17, 
    fontWeight: '700',
    color: '#1E293B', 
  },
  seeAllText: {
    fontSize: 15, 
    fontWeight: '400',
    color: '#94A3B8', 
  },

  // List Styles
  scrollContent: {
    paddingHorizontal: staticTheme.spacing.xl,
    gap: 20, 
  },
  categoryItem: {
    alignItems: 'center',
    width: 72, // Slightly increased from 64 to fit "Test Series" label nicely
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 1, 
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10, 
  },
  categoryTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569', 
    textAlign: 'center',
  },
});