class Company {
  constructor(data) {
    this.uid = data.uid;
    this.email = data.email;
    this.companyName = data.companyName;
    this.firstName = data.firstName;
    this.lastName = data.lastName;
    this.role = 'company';
    this.description = data.description;
    this.industry = data.industry;
    this.contactInfo = data.contactInfo || {};
    this.address = data.address || {};
    this.logoUrl = data.logoUrl;
    this.website = data.website;
    this.approved = data.approved || false;
    this.createdAt = data.createdAt || new Date();
    this.updatedAt = data.updatedAt || new Date();
  }

  toFirestore() {
    return {
      uid: this.uid,
      email: this.email,
      companyName: this.companyName,
      firstName: this.firstName,
      lastName: this.lastName,
      role: this.role,
      description: this.description,
      industry: this.industry,
      contactInfo: this.contactInfo,
      address: this.address,
      logoUrl: this.logoUrl,
      website: this.website,
      approved: this.approved,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
  }

  static fromFirestore(doc) {
    const data = doc.data();
    return new Company({
      uid: doc.id,
      ...data
    });
  }
}

module.exports = Company;