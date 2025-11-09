class Institution {
  constructor(data) {
    this.uid = data.uid;
    this.email = data.email;
    this.institutionName = data.institutionName;
    this.firstName = data.firstName;
    this.lastName = data.lastName;
    this.role = 'institution';
    this.description = data.description;
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
      institutionName: this.institutionName,
      firstName: this.firstName,
      lastName: this.lastName,
      role: this.role,
      description: this.description,
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
    return new Institution({
      uid: doc.id,
      ...data
    });
  }
}

module.exports = Institution;