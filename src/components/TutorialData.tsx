// Tutorial content for different features

export const newCaseTutorial = {
  title: "Creating a New Case",
  steps: [
    {
      title: "Start with Case Details",
      content: "Fill in the basic case information including case name, patient MRN, and procedure date. The case name is required.",
      highlight: "Use descriptive names like 'Smith Gallbladder Surgery' for easy identification",
      tips: [
        "Patient MRN is HIPAA compliant and optional",
        "Default date is set to today",
        "Add procedure descriptions for better code suggestions"
      ]
    },
    {
      title: "Search for CPT Codes",
      content: "Use the dictation card below to describe your procedure. You can type, speak, or upload a photo of procedure notes.",
      highlight: "Be specific in your descriptions for better AI recommendations",
      tips: [
        "Use medical terminology when possible",
        "Include anatomical locations and surgical approaches",
        "Mention any complications or additional procedures"
      ]
    },
    {
      title: "Review and Add Codes",
      content: "The AI will suggest relevant CPT codes based on your description. Review each code and add the ones that apply to your case.",
      tips: [
        "Check RVU values for accuracy",
        "Look for appropriate modifiers",
        "Consider bundling rules and exclusions"
      ]
    },
    {
      title: "Calculate Case Value",
      content: "Set your RVU compensation rate to see the estimated case value. You can use your profile default or customize it per case.",
      highlight: "Your profile default RVU rate can be set in settings",
      tips: [
        "Different payers may have different rates",
        "Consider geographic adjustments",
        "Factor in practice overhead"
      ]
    },
    {
      title: "Save Your Case",
      content: "Once you're satisfied with the codes and calculations, save the case. You can always return to modify it later.",
      tips: [
        "Cases are automatically associated with your account",
        "Saved cases appear in your dashboard",
        "You can generate reports from saved cases"
      ]
    }
  ]
};

export const searchCodesTutorial = {
  title: "Searching for CPT Codes",
  steps: [
    {
      title: "Input Your Procedure",
      content: "Describe the procedure you performed using the input methods available: text, voice, or photo upload.",
      highlight: "More detailed descriptions lead to better code suggestions",
      tips: [
        "Include surgical approach (open, laparoscopic, robotic)",
        "Mention anatomical structures involved",
        "Note any additional procedures performed"
      ]
    },
    {
      title: "AI Analysis",
      content: "Our AI analyzes your procedure description against the CPT code database to find the most relevant matches.",
      tips: [
        "The system considers code relationships and bundling rules",
        "Multiple codes may be suggested for complex procedures",
        "Results are ranked by relevance and accuracy"
      ]
    },
    {
      title: "Review Suggestions",
      content: "Examine each suggested code for accuracy. Check the description, RVU value, and any applicable modifiers.",
      highlight: "Always verify codes match your actual procedure",
      tips: [
        "Read full code descriptions carefully",
        "Check for gender or age-specific codes",
        "Consider bilateral procedures and modifiers"
      ]
    },
    {
      title: "Get AI Recommendations",
      content: "Use the 'Chat with AI' feature to ask specific questions about code selection, modifiers, or billing best practices.",
      tips: [
        "Ask about code combinations and bundling",
        "Inquire about documentation requirements",
        "Get advice on modifier usage"
      ]
    }
  ]
};

export const dashboardTutorial = {
  title: "Dashboard Overview",
  steps: [
    {
      title: "Statistics Overview",
      content: "The top section shows your key metrics including total searches, recent activity, and RVU accumulation.",
      highlight: "These stats help track your coding productivity and patterns",
      tips: [
        "Monthly totals help with financial planning",
        "Search history shows coding efficiency",
        "RVU tracking assists with compensation calculations"
      ]
    },
    {
      title: "Quick Actions",
      content: "Use the feature cards to quickly access main functionalities like code search, analytics, and settings.",
      tips: [
        "Find Codes: Search for CPT codes",
        "Common Procedures: Access frequently used codes",
        "Analytics: View detailed reports and trends"
      ]
    },
    {
      title: "Recent Activity",
      content: "Track your recent code searches and case creations to maintain continuity in your workflow.",
      tips: [
        "Review recent codes for accuracy",
        "Track procedure patterns",
        "Identify common coding needs"
      ]
    },
    {
      title: "Most Common Procedures",
      content: "See which procedures you code most frequently to optimize your workflow and identify specialization patterns.",
      highlight: "This data helps optimize your coding templates and shortcuts",
      tips: [
        "Create templates for common procedures",
        "Review coding consistency",
        "Identify training needs for complex procedures"
      ]
    }
  ]
};

export const generalTips = {
  title: "OpCoder Tips & Best Practices",
  steps: [
    {
      title: "Accurate Documentation",
      content: "The quality of your procedure descriptions directly impacts code accuracy. Be specific and use proper medical terminology.",
      highlight: "Good input = Better output",
      tips: [
        "Include anatomical specificity",
        "Mention surgical approach and techniques",
        "Note any complications or additional work"
      ]
    },
    {
      title: "Code Verification",
      content: "Always review suggested codes against your actual procedure. AI suggestions are starting points, not final decisions.",
      tips: [
        "Check code descriptions thoroughly",
        "Verify RVU values with current schedules",
        "Consider payer-specific requirements"
      ]
    },
    {
      title: "Modifier Management",
      content: "Pay attention to suggested modifiers and understand their impact on reimbursement and compliance.",
      highlight: "Incorrect modifiers can cause claim denials or compliance issues",
      tips: [
        "Understand modifier definitions",
        "Check payer-specific modifier requirements",
        "Document support for modifier usage"
      ]
    },
    {
      title: "Continuous Learning",
      content: "Use the chat feature to ask questions and learn about coding best practices, new codes, and industry updates.",
      tips: [
        "Ask about code updates and changes",
        "Inquire about documentation requirements",
        "Get guidance on complex procedures"
      ]
    }
  ]
};