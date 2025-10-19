import { supabase } from '../supabase/client';

// Sample schemes data
const sampleSchemes = [
  {
    title: "PM-KISAN Samman Nidhi",
    description: "Direct income support scheme for farmers providing ₹6000 per year in three equal installments.",
    eligibility: "Small and marginal farmers with cultivable land up to 2 hectares",
    documents: [
      { name: "Aadhaar Card", description: "Valid Aadhaar card of the farmer" },
      { name: "Bank Account Details", description: "Bank passbook or cancelled cheque" },
      { name: "Land Records", description: "Khata/Khatauni/Land ownership documents" }
    ],
    government_link: "https://pmkisan.gov.in/",
    created_at: new Date().toISOString()
  },
  {
    title: "Pradhan Mantri Fasal Bima Yojana",
    description: "Crop insurance scheme providing financial support to farmers in case of crop loss due to natural calamities.",
    eligibility: "All farmers growing notified crops in notified areas",
    documents: [
      { name: "Aadhaar Card", description: "Identity proof" },
      { name: "Bank Account Details", description: "For premium deduction and claim settlement" },
      { name: "Land Records", description: "Proof of land ownership or tenancy" }
    ],
    government_link: "https://pmfby.gov.in/",
    created_at: new Date().toISOString()
  },
  {
    title: "Kisan Credit Card (KCC)",
    description: "Credit facility for farmers to meet their agricultural and allied activities requirements.",
    eligibility: "All farmers - individual/joint borrowers who are owner cultivators",
    documents: [
      { name: "Application Form", description: "Duly filled KCC application form" },
      { name: "Identity Proof", description: "Aadhaar card, Voter ID, or Passport" },
      { name: "Land Documents", description: "Land ownership or tenancy proof" }
    ],
    government_link: "https://www.nabard.org/content1.aspx?id=570",
    created_at: new Date().toISOString()
  }
];

// Sample contacts data
const sampleContacts = [
  {
    name: "Dr. Rajesh Kumar",
    specialization: "Crop Diseases",
    crop_type: "Rice",
    contact_info: "+91-9876543210, dr.rajesh@agri.gov.in",
    region: "North"
  },
  {
    name: "Dr. Priya Sharma",
    specialization: "Soil Management",
    crop_type: "Tomato",
    contact_info: "+91-9876543211, priya.sharma@agri.edu",
    region: "West"
  },
  {
    name: "Dr. Amit Singh",
    specialization: "Pest Control",
    crop_type: "Cotton",
    contact_info: "+91-9876543212, amit.singh@icar.gov.in",
    region: "Central"
  },
  {
    name: "Dr. Sunita Patel",
    specialization: "Organic Farming",
    crop_type: "Wheat",
    contact_info: "+91-9876543213, sunita.organic@gmail.com",
    region: "West"
  },
  {
    name: "Dr. K. Venkatesh",
    specialization: "Rice Cultivation",
    crop_type: "Rice",
    contact_info: "+91-9876543214, k.venkatesh@tnau.ac.in",
    region: "South"
  }
];

// Sample pesticides data
const samplePesticides = [
  {
    name: "Chlorpyrifos 20% EC",
    crop_type: "Rice",
    description: "Effective insecticide for controlling stem borer, leaf folder, and brown plant hopper in rice crops.",
    recommended_usage: "2-2.5 ml/liter water. Apply during early morning or evening. Maximum 2 applications per season.",
    price_range: "₹150-200 per 100ml bottle"
  },
  {
    name: "NPK 19:19:19",
    crop_type: "Wheat",
    description: "Balanced fertilizer containing equal proportions of Nitrogen, Phosphorus, and Potassium for healthy crop growth.",
    recommended_usage: "25-50 kg/acre. Apply in 2-3 split doses during crop season. Mix with soil properly.",
    price_range: "₹800-1200 per 50kg bag"
  },
  {
    name: "Neem Oil",
    crop_type: "Tomato",
    description: "Organic pesticide effective against aphids, whiteflies, and caterpillars. Safe for beneficial insects.",
    recommended_usage: "3-5 ml/liter water. Apply weekly during pest season. Spray during evening hours.",
    price_range: "₹80-120 per 100ml bottle"
  },
  {
    name: "Mancozeb 75% WP",
    crop_type: "Potato",
    description: "Broad-spectrum fungicide for controlling late blight, early blight, and other fungal diseases.",
    recommended_usage: "2-2.5 gm/liter water. Apply every 10-15 days during disease season. Maintain 7 days pre-harvest interval.",
    price_range: "₹200-300 per 250gm pack"
  }
];

// Demo Users Data
const demoUsers = [
  {
    email: 'farmer@farmtech.com',
    password: 'farmer123456',
    userData: {
      name: 'John Farmer',
      phone: '+91-9876543210',
      role: 'farmer',
      farm_location: 'Punjab, India',
      crop_type: 'Rice'
    }
  },
  {
    email: 'admin@farmtech.com',
    password: 'admin123456',
    userData: {
      name: 'Admin User',
      phone: '+91-9876543211',
      role: 'admin'
    }
  }
];

export const seedSupabaseDatabase = async () => {
  try {
    console.log('Seeding Supabase database with sample data...');

    let farmerUserId = null;

    // Create demo users
    for (const demoUser of demoUsers) {
      try {
        // Create auth user
        const { data: authData, error: authError } = await supabase.auth.signUp({
          email: demoUser.email,
          password: demoUser.password,
          options: {
            data: {
              name: demoUser.userData.name,
              role: demoUser.userData.role
            }
          }
        });

        if (authError && authError.message !== 'User already registered') {
          throw authError;
        }

        if (authData.user) {
          const userId = authData.user.id;
          
          if (demoUser.userData.role === 'farmer') {
            farmerUserId = userId;
          }

          // Create user profile
          const { error: profileError } = await supabase
            .from('users')
            .upsert([{
              id: userId,
              email: demoUser.email,
              ...demoUser.userData,
              created_at: new Date().toISOString()
            }]);

          if (profileError) throw profileError;
          
          console.log(`✅ Demo ${demoUser.userData.role} user created: ${demoUser.email}`);
        }
      } catch (error) {
        if (error.message?.includes('already registered') || error.message?.includes('already exists')) {
          console.log(`ℹ️ Demo user ${demoUser.email} already exists`);
        } else {
          console.error(`❌ Error creating demo user ${demoUser.email}:`, error);
        }
      }
    }

    // Add sample uploads for demo farmer
    if (farmerUserId) {
      const sampleUploads = [
        {
          user_id: farmerUserId,
          image_url: 'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=400',
          description: 'My wheat crop is showing yellow spots on leaves. Need expert advice.',
          crop_type: 'Wheat',
          status: 'reviewed',
          admin_feedback: 'This appears to be wheat rust. Apply fungicide immediately and ensure proper drainage.',
          created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
          user_id: farmerUserId,
          image_url: 'https://images.unsplash.com/photo-1500937386664-56d1dfef3854?w=400',
          description: 'Rice plants are not growing properly. Leaves turning brown.',
          crop_type: 'Rice',
          status: 'pending',
          created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()
        }
      ];

      const { error: uploadsError } = await supabase
        .from('uploads')
        .upsert(sampleUploads);

      if (uploadsError) throw uploadsError;
      console.log('✅ Sample uploads added successfully');
    }

    // Add schemes
    const { error: schemesError } = await supabase
      .from('schemes')
      .upsert(sampleSchemes);

    if (schemesError) throw schemesError;
    console.log('✅ Schemes added successfully');

    // Add contacts
    const { error: contactsError } = await supabase
      .from('contacts')
      .upsert(sampleContacts);

    if (contactsError) throw contactsError;
    console.log('✅ Contacts added successfully');

    // Add pesticides
    const { error: pesticidesError } = await supabase
      .from('pesticides')
      .upsert(samplePesticides);

    if (pesticidesError) throw pesticidesError;
    console.log('✅ Pesticides added successfully');

    // Update stats
    const { error: statsError } = await supabase
      .from('stats')
      .upsert([{
        id: '00000000-0000-0000-0000-000000000001',
        total_users: demoUsers.length,
        total_uploads: 2,
        total_schemes: sampleSchemes.length,
        last_updated: new Date().toISOString()
      }]);

    if (statsError) throw statsError;
    console.log('✅ Stats updated successfully');

    console.log('🎉 Supabase database seeded successfully with demo data!');
    return true;
  } catch (error) {
    console.error('❌ Error seeding Supabase database:', error);
    return false;
  }
};