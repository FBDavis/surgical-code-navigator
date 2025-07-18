import { Tutorial } from './TutorialManager';

// Basic Navigation Tutorial
export const basicNavigationTutorial: Tutorial = {
  id: 'basics',
  title: 'Basic Navigation',
  description: 'Learn how to navigate around OpCoder',
  category: 'basics',
  icon: 'compass',
  estimatedTime: 3,
  steps: [
    {
      id: 'welcome',
      title: 'Welcome to OpCoder!',
      content: 'This is your medical coding companion. Let\'s take a quick tour of the main features.',
      position: 'center',
      highlight: 'OpCoder helps you find CPT codes, manage cases, and track RVUs efficiently.'
    },
    {
      id: 'dashboard',
      title: 'Your Dashboard',
      content: 'This is your main dashboard where you can see your activity, quick stats, and access all features.',
      element: '.dashboard-main',
      position: 'center',
      tips: [
        'View your coding statistics at the top',
        'Access quick actions for common tasks',
        'See your recent activity and top procedures'
      ]
    },
    {
      id: 'navigation',
      title: 'Navigation Menu',
      content: 'Use the navigation menu to switch between different sections of the app.',
      element: '.Navigation',
      position: 'right',
      tips: [
        'Desktop: Use the sidebar on the left',
        'Mobile: Use the bottom tab bar',
        'Menu button opens full navigation on mobile'
      ]
    },
    {
      id: 'quick-actions',
      title: 'Quick Actions',
      content: 'These large buttons give you instant access to the most common tasks.',
      element: '.quick-actions',
      position: 'bottom',
      highlight: 'Start with "Find Codes" to search for CPT codes or "New Case" to create a case',
      tips: [
        'Find Codes: Search for specific CPT codes',
        'New Case: Create and manage procedure cases'
      ]
    }
  ]
};

// Code Search Tutorial
export const codeSearchTutorial: Tutorial = {
  id: 'search',
  title: 'CPT Code Search',
  description: 'Learn how to find the right CPT codes quickly',
  category: 'basics',
  icon: 'search',
  estimatedTime: 5,
  steps: [
    {
      id: 'search-intro',
      title: 'Finding CPT Codes',
      content: 'The search feature helps you find the correct CPT codes for your procedures using AI-powered analysis.',
      position: 'center'
    },
    {
      id: 'input-methods',
      title: 'Multiple Input Methods',
      content: 'You can describe procedures by typing, speaking, or uploading photos of operative notes.',
      element: '.dictation-card',
      position: 'bottom',
      tips: [
        'Type: Enter procedure descriptions directly',
        'Speak: Use voice input for hands-free operation',
        'Photo: Upload images of operative reports'
      ]
    },
    {
      id: 'ai-analysis',
      title: 'AI-Powered Analysis',
      content: 'Our AI analyzes your input and suggests the most relevant CPT codes based on current guidelines.',
      highlight: 'Be specific in your descriptions for better accuracy',
      tips: [
        'Include anatomical locations',
        'Mention surgical approach (open, laparoscopic, etc.)',
        'Note any complications or additional procedures'
      ]
    },
    {
      id: 'review-codes',
      title: 'Review Suggested Codes',
      content: 'Examine each suggested code carefully. Check descriptions, RVU values, and modifiers.',
      element: '.cpt-code-results',
      position: 'top',
      tips: [
        'Verify code descriptions match your procedure',
        'Check RVU values for compensation planning',
        'Review suggested modifiers for accuracy'
      ]
    },
    {
      id: 'chat-ai',
      title: 'Ask the AI',
      content: 'Use the chat feature to ask specific questions about codes, modifiers, or billing practices.',
      element: '.chat-interface',
      position: 'left',
      tips: [
        'Ask about code combinations',
        'Inquire about documentation requirements',
        'Get guidance on complex procedures'
      ]
    }
  ]
};

// Case Management Tutorial
export const caseManagementTutorial: Tutorial = {
  id: 'cases',
  title: 'Case Management',
  description: 'Learn to create and manage procedure cases',
  category: 'workflow',
  icon: 'folder',
  estimatedTime: 7,
  steps: [
    {
      id: 'case-intro',
      title: 'Creating Cases',
      content: 'Cases help you organize procedures, track codes, and calculate values for billing and reporting.',
      position: 'center'
    },
    {
      id: 'case-details',
      title: 'Basic Case Information',
      content: 'Start by filling in the essential case details like name, patient information, and procedure date.',
      element: '.case-form',
      position: 'bottom',
      tips: [
        'Use descriptive case names for easy identification',
        'Patient MRN is optional but helpful for tracking',
        'Set the correct procedure date for accurate reporting'
      ]
    },
    {
      id: 'add-codes',
      title: 'Adding CPT Codes',
      content: 'Use the search functionality to find and add relevant CPT codes to your case.',
      element: '.code-search-section',
      position: 'top',
      highlight: 'You can add multiple codes to a single case for complex procedures'
    },
    {
      id: 'code-management',
      title: 'Managing Codes',
      content: 'Set primary codes, add modifiers, and organize codes by importance within your case.',
      tips: [
        'Mark the main procedure as primary',
        'Add appropriate modifiers for billing',
        'Consider bundling rules and exclusions'
      ]
    },
    {
      id: 'case-value',
      title: 'Calculate Case Value',
      content: 'Set your RVU compensation rate to see the estimated value of your case.',
      element: '.rvu-calculator',
      position: 'bottom',
      tips: [
        'Use your profile default rate or customize per case',
        'Consider different payer rates',
        'Factor in geographic adjustments'
      ]
    },
    {
      id: 'save-case',
      title: 'Save and Track',
      content: 'Save your case to track it in your dashboard and generate reports later.',
      highlight: 'Saved cases contribute to your statistics and can be exported for billing'
    }
  ]
};

// RVU Tracking Tutorial
export const rvuTrackingTutorial: Tutorial = {
  id: 'rvu',
  title: 'RVU Tracking & Analytics',
  description: 'Monitor your productivity and compensation',
  category: 'analytics',
  icon: 'trending-up',
  estimatedTime: 4,
  steps: [
    {
      id: 'rvu-intro',
      title: 'Understanding RVUs',
      content: 'Relative Value Units (RVUs) are the standard measure for physician work and compensation planning.',
      position: 'center',
      highlight: 'OpCoder automatically tracks your RVUs across all cases and procedures'
    },
    {
      id: 'dashboard-stats',
      title: 'Dashboard Statistics',
      content: 'Your dashboard shows key RVU metrics including totals, trends, and projections.',
      element: '.stats-overview',
      position: 'bottom',
      tips: [
        'Total RVUs: Cumulative value across all cases',
        'Monthly totals: Track productivity trends',
        'Recent activity: Monitor current period performance'
      ]
    },
    {
      id: 'compensation-rates',
      title: 'Set Compensation Rates',
      content: 'Configure your RVU compensation rate in settings to see accurate value calculations.',
      element: '.settings-link',
      position: 'left',
      tips: [
        'Use your contract rate per RVU',
        'Consider different rates for different payers',
        'Update rates when contracts change'
      ]
    },
    {
      id: 'analytics-dashboard',
      title: 'Detailed Analytics',
      content: 'Access the analytics section for comprehensive reports and trend analysis.',
      element: '.analytics-link',
      position: 'top',
      tips: [
        'View monthly and yearly trends',
        'Compare procedure types and complexity',
        'Export data for compensation discussions'
      ]
    }
  ]
};

// Resident Case Logs Tutorial
export const residentLogsTutorial: Tutorial = {
  id: 'resident',
  title: 'Resident Case Logs',
  description: 'Track training cases and meet ACGME requirements',
  category: 'workflow',
  icon: 'graduation-cap',
  estimatedTime: 6,
  steps: [
    {
      id: 'resident-intro',
      title: 'Training Case Management',
      content: 'The resident tracker helps you log cases and monitor progress toward ACGME requirements.',
      position: 'center',
      highlight: 'Automatically tracks cases against your specialty\'s specific requirements'
    },
    {
      id: 'case-logging',
      title: 'Logging Cases',
      content: 'Record your participation level, case details, and supervisory information for each procedure.',
      element: '.resident-case-form',
      position: 'bottom',
      tips: [
        'Select your role: Observer, Assistant, or Primary',
        'Record accurate case details and dates',
        'Note supervising faculty for verification'
      ]
    },
    {
      id: 'requirements-tracking',
      title: 'Requirements Tracking',
      content: 'Monitor your progress against ACGME minimums for your specialty and training level.',
      element: '.requirements-progress',
      position: 'top',
      tips: [
        'View progress by case category',
        'See remaining requirements for graduation',
        'Track complex and advanced procedures separately'
      ]
    },
    {
      id: 'verification',
      title: 'Case Verification',
      content: 'Submit cases for faculty verification to meet accreditation requirements.',
      highlight: 'Verified cases count toward your official training record',
      tips: [
        'Submit cases promptly for timely verification',
        'Include detailed procedure notes when required',
        'Follow up on pending verifications'
      ]
    }
  ]
};

// Schedule Scanner Tutorial
export const schedulesScannerTutorial: Tutorial = {
  id: 'schedules',
  title: 'Schedule Scanner',
  description: 'Import and analyze surgery schedules',
  category: 'workflow',
  icon: 'camera',
  estimatedTime: 4,
  steps: [
    {
      id: 'scanner-intro',
      title: 'Surgery Schedule Import',
      content: 'Quickly import surgery schedules by taking photos or uploading images of printed schedules.',
      position: 'center'
    },
    {
      id: 'photo-capture',
      title: 'Capture Schedule',
      content: 'Use your device camera to photograph surgery schedules or upload existing images.',
      element: '.camera-capture',
      position: 'bottom',
      tips: [
        'Ensure good lighting for clear text recognition',
        'Capture the entire schedule in the frame',
        'Multiple photos can be processed together'
      ]
    },
    {
      id: 'ai-processing',
      title: 'AI Text Recognition',
      content: 'Our AI extracts procedure information, times, and patient details from your schedule images.',
      highlight: 'The system recognizes various schedule formats automatically',
      tips: [
        'Review extracted information for accuracy',
        'Edit any incorrect text recognition',
        'Confirm procedure codes and times'
      ]
    },
    {
      id: 'case-creation',
      title: 'Auto-Create Cases',
      content: 'Automatically generate cases from your schedule for easy tracking and billing preparation.',
      tips: [
        'Cases are pre-populated with schedule information',
        'Add additional codes as procedures are completed',
        'Update case details after surgery'
      ]
    }
  ]
};

// Export all tutorials
export const allTutorials: Tutorial[] = [
  basicNavigationTutorial,
  codeSearchTutorial,
  caseManagementTutorial,
  rvuTrackingTutorial,
  residentLogsTutorial,
  schedulesScannerTutorial,
];

// Tutorial sequences for guided onboarding
export const onboardingSequence = {
  beginner: [
    basicNavigationTutorial,
    codeSearchTutorial,
    caseManagementTutorial,
  ],
  resident: [
    basicNavigationTutorial,
    codeSearchTutorial,
    residentLogsTutorial,
    schedulesScannerTutorial,
  ],
  advanced: [
    caseManagementTutorial,
    rvuTrackingTutorial,
    schedulesScannerTutorial,
  ],
};