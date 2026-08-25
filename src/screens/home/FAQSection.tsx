import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, LayoutAnimation, Platform, UIManager } from 'react-native';
import { ChevronDown, ChevronUp, HelpCircle } from 'lucide-react-native';
import { useTheme } from '../../context/ThemeContext';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const FAQS = [
  { question: 'How do I access free resources?', answer: 'You can access all free resources by clicking on the "Free Resources" section on the home screen. It contains PYQs, Syllabus, and Current Affairs.' },
  { question: 'Can I download PDF files?', answer: 'Yes, most of our study materials and PYQs are downloadable. Look for the download icon in the document viewer.' },
  { question: 'How can I contact support?', answer: 'You can reach us through the "Help Support Chat" in your profile section. We typically respond within 24 hours.' },
  { question: 'Are the test series updated?', answer: 'Yes, our test series are regularly updated to match the latest exam patterns and difficulty levels.' },
];

const FAQItem = ({ item }: any) => {
  const { theme, isDarkMode } = useTheme();
  const [expanded, setExpanded] = useState(false);

  const toggle = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpanded(!expanded);
  };

  return (
    <TouchableOpacity 
      style={[
        styles.item, 
        {
          backgroundColor: theme.colors.surface,
          borderColor: expanded ? theme.colors.primary : theme.colors.border,
        },
        expanded && {
          shadowColor: theme.colors.primary,
          shadowOffset: { width: 0, height: 3 },
          shadowOpacity: isDarkMode ? 0.25 : 0.08,
          shadowRadius: 8,
          elevation: 3,
        }
      ]} 
      onPress={toggle} 
      activeOpacity={0.8}
    >
      <View style={styles.questionRow}>
        <Text style={[styles.question, { color: expanded ? theme.colors.primary : theme.colors.textMain }]}>
          {item.question}
        </Text>
        {expanded ? <ChevronUp size={18} color={theme.colors.primary} /> : <ChevronDown size={18} color={theme.colors.textMuted} />}
      </View>
      {expanded && (
        <View style={[styles.answerContainer, { borderTopColor: theme.colors.border }]}>
          <Text style={[styles.answer, { color: theme.colors.textMuted }]}>{item.answer}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

export const FAQSection = () => {
  const { theme } = useTheme();

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <HelpCircle color={theme.colors.primary} size={20} />
          <Text style={[styles.title, { color: theme.colors.textMain }]}>Common Questions</Text>
        </View>
      </View>

      <View style={styles.list}>
        {FAQS.map((faq, index) => (
          <FAQItem key={index} item={faq} />
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
    marginBottom: 20,
  },
  header: {
    marginBottom: 15,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: -0.4,
  },
  list: {
    gap: 10,
  },
  item: {
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
  },
  questionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },
  question: {
    flex: 1,
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 19,
  },
  answerContainer: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
  },
  answer: {
    fontSize: 13,
    lineHeight: 20,
    fontWeight: '500',
  },
});

export default FAQSection;
