// Database type definitions for Supabase tables

/**
 * @typedef {Object} User
 * @property {string} id - UUID primary key
 * @property {string} name - User's full name
 * @property {string} email - User's email address
 * @property {string} [phone] - User's phone number
 * @property {'farmer' | 'admin'} role - User role
 * @property {string} [farm_location] - Farm location for farmers
 * @property {string} [crop_type] - Primary crop type for farmers
 * @property {string} created_at - Timestamp of account creation
 */

/**
 * @typedef {Object} Upload
 * @property {string} id - UUID primary key
 * @property {string} user_id - Reference to user who uploaded
 * @property {string} image_url - URL to the uploaded image
 * @property {string} description - Description of the upload
 * @property {string} crop_type - Type of crop in the image
 * @property {'pending' | 'reviewed'} status - Review status
 * @property {string} [admin_feedback] - Feedback from admin
 * @property {string} created_at - Timestamp of upload
 */

/**
 * @typedef {Object} Scheme
 * @property {string} id - UUID primary key
 * @property {string} title - Scheme title
 * @property {string} description - Scheme description
 * @property {string} eligibility - Eligibility criteria
 * @property {Array<{name: string, description: string}>} documents - Required documents
 * @property {string} government_link - Official government link
 * @property {string} created_by - Reference to admin who created
 * @property {string} created_at - Timestamp of creation
 */

/**
 * @typedef {Object} Contact
 * @property {string} id - UUID primary key
 * @property {string} name - Contact person name
 * @property {string} specialization - Area of specialization
 * @property {string} crop_type - Relevant crop type
 * @property {string} contact_info - Phone/email contact information
 * @property {string} region - Geographic region
 */

/**
 * @typedef {Object} Pesticide
 * @property {string} id - UUID primary key
 * @property {string} name - Pesticide name
 * @property {string} crop_type - Applicable crop type
 * @property {string} description - Product description
 * @property {string} recommended_usage - Usage instructions
 * @property {string} price_range - Price range information
 */

/**
 * @typedef {Object} Stats
 * @property {string} id - UUID primary key
 * @property {number} total_users - Total number of users
 * @property {number} total_uploads - Total number of uploads
 * @property {number} total_schemes - Total number of schemes
 * @property {string} last_updated - Last update timestamp
 */

export {}