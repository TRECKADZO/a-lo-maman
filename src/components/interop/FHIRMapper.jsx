import { v4 as uuidv4 } from 'uuid';

/**
 * Service de mapping entre entités AloMaman et ressources FHIR R4
 */
export class FHIRMapper {
  
  // ============================================
  // ALOMAMAN -> FHIR: PATIENT (Maman)
  // ============================================
  static toFHIRPatient(profil, user) {
    return {
      resourceType: "Patient",
      id: user.id,
      identifier: [
        {
          system: "https://alomaman.ci/patient-id",
          value: user.id
        },
        ...(profil.numero_cmu ? [{
          system: "urn:oid:ci:cmu",
          value: profil.numero_cmu,
          type: {
            coding: [{
              system: "http://terminology.hl7.org/CodeSystem/v2-0203",
              code: "SB"
            }]
          }
        }] : [])
      ],
      active: true,
      name: [
        {
          use: "official",
          text: profil.nom_complet || user.full_name,
          family: (profil.nom_complet || user.full_name)?.split(' ').pop() || '',
          given: (profil.nom_complet || user.full_name)?.split(' ').slice(0, -1) || []
        }
      ],
      telecom: [
        {
          system: "email",
          value: user.email,
          use: "home"
        },
        ...(profil.telephone ? [{
          system: "phone",
          value: profil.telephone,
          use: "mobile"
        }] : [])
      ],
      gender: "female",
      birthDate: profil.date_naissance,
      address: profil.ville || profil.adresse ? [
        {
          use: "home",
          type: "physical",
          text: profil.adresse,
          city: profil.ville,
          district: profil.region,
          country: "CI"
        }
      ] : [],
      maritalStatus: profil.situation_familiale ? {
        coding: [{
          system: "http://terminology.hl7.org/CodeSystem/v3-MaritalStatus",
          code: profil.situation_familiale === 'mariee' ? 'M' : 'S'
        }]
      } : null,
      contact: profil.contact_urgence ? [{
        relationship: [{
          coding: [{
            system: "http://terminology.hl7.org/CodeSystem/v2-0131",
            code: "C"
          }]
        }],
        name: { text: profil.contact_urgence.nom },
        telecom: [{
          system: "phone",
          value: profil.contact_urgence.telephone
        }]
      }] : [],
      communication: [
        {
          language: {
            coding: [{
              system: "urn:ietf:bcp:47",
              code: profil.langue_preferee === "anglais" ? "en" : "fr"
            }]
          },
          preferred: true
        }
      ]
    };
  }

  // ============================================
  // ALOMAMAN -> FHIR: PRACTITIONER
  // ============================================
  static toFHIRPractitioner(professionnel) {
    return {
      resourceType: 'Practitioner',
      id: professionnel.id,
      identifier: [
        {
          system: 'urn:oid:alomaman:professionnel',
          value: professionnel.id
        },
        ...(professionnel.numero_ordre ? [{
          system: 'urn:oid:ci:ordre',
          value: professionnel.numero_ordre,
          type: {
            coding: [{
              system: 'http://terminology.hl7.org/CodeSystem/v2-0203',
              code: 'MD'
            }]
          }
        }] : [])
      ],
      active: professionnel.compte_verifie || false,
      name: [{
        use: 'official',
        text: professionnel.nom_complet,
        family: professionnel.nom_complet?.split(' ').slice(-1)[0],
        given: professionnel.nom_complet?.split(' ').slice(0, -1)
      }],
      telecom: [
        ...(professionnel.telephone ? [{
          system: 'phone',
          value: professionnel.telephone,
          use: 'work'
        }] : []),
        ...(professionnel.email ? [{
          system: 'email',
          value: professionnel.email,
          use: 'work'
        }] : [])
      ],
      address: professionnel.adresse ? [{
        use: 'work',
        type: 'physical',
        text: professionnel.adresse,
        city: professionnel.ville,
        district: professionnel.region,
        country: 'CI'
      }] : [],
      gender: 'unknown',
      photo: professionnel.photo ? [{
        url: professionnel.photo
      }] : [],
      qualification: [{
        code: {
          coding: [{
            system: 'http://snomed.info/sct',
            code: this.mapSpecialityToSNOMED(professionnel.specialite),
            display: professionnel.specialite
          }]
        }
      }],
      communication: (professionnel.langues || []).map(lang => ({
        coding: [{
          system: 'urn:ietf:bcp:47',
          code: lang === 'Français' ? 'fr' : lang === 'Anglais' ? 'en' : 'fr'
        }]
      }))
    };
  }

  static mapSpecialityToSNOMED(specialite) {
    const map = {
      'gynecologie': '394586005',
      'pediatrie': '394537008',
      'sage_femme': '224529009',
      'medecin_generaliste': '59058001',
      'infirmier': '106292003',
      'nutritionniste': '159033005'
    };
    return map[specialite] || '59058001';
  }

  // ============================================
  // ALOMAMAN -> FHIR: ORGANIZATION
  // ============================================
  static toFHIROrganization(clinique) {
    return {
      resourceType: 'Organization',
      id: clinique.id,
      identifier: [
        {
          system: 'urn:oid:alomaman:clinique',
          value: clinique.id
        },
        ...(clinique.numero_agrement ? [{
          system: 'urn:oid:ci:msp:agrement',
          value: clinique.numero_agrement
        }] : [])
      ],
      active: true,
      type: [{
        coding: [{
          system: 'http://terminology.hl7.org/CodeSystem/organization-type',
          code: clinique.type_etablissement === 'clinique_privee' ? 'prov' : 'govt',
          display: clinique.type_etablissement
        }]
      }],
      name: clinique.nom,
      telecom: [
        ...(clinique.telephone ? [{
          system: 'phone',
          value: clinique.telephone,
          use: 'work'
        }] : []),
        ...(clinique.email_contact ? [{
          system: 'email',
          value: clinique.email_contact,
          use: 'work'
        }] : [])
      ],
      address: clinique.adresse ? [{
        use: 'work',
        type: 'physical',
        text: clinique.adresse,
        city: clinique.ville,
        district: clinique.region,
        country: 'CI'
      }] : []
    };
  }

  // ============================================
  // ALOMAMAN -> FHIR: ENCOUNTER
  // ============================================
  static toFHIREncounter(rendezVous, patientEmail) {
    return {
      resourceType: 'Encounter',
      id: rendezVous.id,
      identifier: [{
        system: 'urn:oid:alomaman:encounter',
        value: rendezVous.id
      }],
      status: this.mapEncounterStatus(rendezVous.statut),
      class: {
        system: 'http://terminology.hl7.org/CodeSystem/v3-ActCode',
        code: this.mapEncounterClass(rendezVous.type_consultation),
        display: rendezVous.type_consultation
      },
      type: [{
        coding: [{
          system: 'http://snomed.info/sct',
          code: '169762007',
          display: 'Prenatal visit'
        }]
      }],
      subject: {
        identifier: { value: patientEmail }
      },
      participant: [{
        type: [{
          coding: [{
            system: 'http://terminology.hl7.org/CodeSystem/v3-ParticipationType',
            code: 'PPRF'
          }]
        }],
        individual: {
          reference: `Practitioner/${rendezVous.professionnel_id}`
        }
      }],
      period: {
        start: rendezVous.date_rdv,
        end: rendezVous.statut === 'termine' ? rendezVous.date_rdv : null
      },
      reasonCode: rendezVous.motif ? [{
        text: rendezVous.motif
      }] : [],
      location: rendezVous.adresse_consultation ? [{
        location: {
          display: rendezVous.adresse_consultation
        }
      }] : []
    };
  }

  static mapEncounterStatus(statut) {
    const map = {
      'planifie': 'planned',
      'confirme': 'planned',
      'en_cours': 'in-progress',
      'termine': 'finished',
      'annule': 'cancelled'
    };
    return map[statut] || 'planned';
  }

  static mapEncounterClass(type) {
    const map = {
      'cabinet': 'AMB',
      'clinique': 'AMB',
      'hopital': 'IMP',
      'telephone': 'VR',
      'visio': 'VR'
    };
    return map[type] || 'AMB';
  }

  // Map EnfantCarnet vers FHIR Patient
  static toFHIRPatientEnfant(enfant) {
    return {
      resourceType: "Patient",
      id: enfant.id,
      identifier: [
        {
          system: "https://alomaman.ci/child-id",
          value: enfant.id
        },
        ...(enfant.numero_cmu ? [{
          system: "urn:oid:2.16.384.1.2.3.4.5.6", // OID fictif CMU CI
          value: enfant.numero_cmu,
          type: {
            coding: [{
              system: "http://terminology.hl7.org/CodeSystem/v2-0203",
              code: "SB",
              display: "Social Beneficiary Identifier"
            }]
          }
        }] : [])
      ],
      active: true,
      name: [
        {
          use: "official",
          family: enfant.nom || '',
          given: [enfant.prenom]
        }
      ],
      gender: enfant.sexe === "masculin" ? "male" : "female",
      birthDate: enfant.date_naissance
    };
  }

  // Map Vaccin vers FHIR Immunization
  static toFHIRImmunization(vaccin, enfantId) {
    return {
      resourceType: "Immunization",
      id: uuidv4(),
      status: "completed",
      vaccineCode: {
        coding: [{
          system: "http://hl7.org/fhir/sid/cvx",
          display: vaccin.nom_vaccin
        }],
        text: vaccin.nom_vaccin
      },
      patient: {
        reference: `Patient/${enfantId}`
      },
      occurrenceDateTime: vaccin.date_administration,
      location: vaccin.lieu ? {
        display: vaccin.lieu
      } : undefined,
      performer: vaccin.professionnel ? [
        {
          actor: {
            display: vaccin.professionnel
          }
        }
      ] : [],
      lotNumber: vaccin.lot,
      note: vaccin.prochain_rappel ? [
        {
          text: `Prochain rappel: ${vaccin.prochain_rappel}`
        }
      ] : []
    };
  }

  // Map Mesure Croissance vers FHIR Observation
  static toFHIRObservationCroissance(mesure, enfantId) {
    const observations = [];

    if (mesure.poids) {
      observations.push({
        resourceType: "Observation",
        id: uuidv4(),
        status: "final",
        category: [{
          coding: [{
            system: "http://terminology.hl7.org/CodeSystem/observation-category",
            code: "vital-signs"
          }]
        }],
        code: {
          coding: [{
            system: "http://loinc.org",
            code: "29463-7",
            display: "Body Weight"
          }]
        },
        subject: {
          reference: `Patient/${enfantId}`
        },
        effectiveDateTime: mesure.date,
        valueQuantity: {
          value: mesure.poids,
          unit: "kg",
          system: "http://unitsofmeasure.org",
          code: "kg"
        }
      });
    }

    if (mesure.taille) {
      observations.push({
        resourceType: "Observation",
        id: uuidv4(),
        status: "final",
        category: [{
          coding: [{
            system: "http://terminology.hl7.org/CodeSystem/observation-category",
            code: "vital-signs"
          }]
        }],
        code: {
          coding: [{
            system: "http://loinc.org",
            code: "8302-2",
            display: "Body Height"
          }]
        },
        subject: {
          reference: `Patient/${enfantId}`
        },
        effectiveDateTime: mesure.date,
        valueQuantity: {
          value: mesure.taille,
          unit: "cm",
          system: "http://unitsofmeasure.org",
          code: "cm"
        }
      });
    }

    if (mesure.perimetre_cranien) {
      observations.push({
        resourceType: "Observation",
        id: uuidv4(),
        status: "final",
        code: {
          coding: [{
            system: "http://loinc.org",
            code: "9843-4",
            display: "Head Occipital-frontal circumference"
          }]
        },
        subject: {
          reference: `Patient/${enfantId}`
        },
        effectiveDateTime: mesure.date,
        valueQuantity: {
          value: mesure.perimetre_cranien,
          unit: "cm",
          system: "http://unitsofmeasure.org",
          code: "cm"
        }
      });
    }

    return observations;
  }

  // Map Données Vitales vers FHIR Observation
  static toFHIRObservationVitals(vitals, patientRef) {
    const observations = [];

    // Tension artérielle (BP)
    if (vitals.tension_systolique && vitals.tension_diastolique) {
      observations.push({
        resourceType: "Observation",
        id: uuidv4(),
        status: "final",
        category: [{
          coding: [{
            system: "http://terminology.hl7.org/CodeSystem/observation-category",
            code: "vital-signs",
            display: "Vital Signs"
          }]
        }],
        code: {
          coding: [{
            system: "http://loinc.org",
            code: "85354-9",
            display: "Blood pressure panel"
          }]
        },
        subject: { reference: patientRef },
        effectiveDateTime: vitals.date,
        component: [
          {
            code: {
              coding: [{
                system: "http://loinc.org",
                code: "8480-6",
                display: "Systolic blood pressure"
              }]
            },
            valueQuantity: {
              value: vitals.tension_systolique,
              unit: "mmHg",
              system: "http://unitsofmeasure.org",
              code: "mm[Hg]"
            }
          },
          {
            code: {
              coding: [{
                system: "http://loinc.org",
                code: "8462-4",
                display: "Diastolic blood pressure"
              }]
            },
            valueQuantity: {
              value: vitals.tension_diastolique,
              unit: "mmHg",
              system: "http://unitsofmeasure.org",
              code: "mm[Hg]"
            }
          }
        ]
      });
    }

    // Température
    if (vitals.temperature) {
      observations.push({
        resourceType: "Observation",
        id: uuidv4(),
        status: "final",
        category: [{
          coding: [{
            system: "http://terminology.hl7.org/CodeSystem/observation-category",
            code: "vital-signs"
          }]
        }],
        code: {
          coding: [{
            system: "http://loinc.org",
            code: "8310-5",
            display: "Body temperature"
          }]
        },
        subject: { reference: patientRef },
        effectiveDateTime: vitals.date,
        valueQuantity: {
          value: vitals.temperature,
          unit: "°C",
          system: "http://unitsofmeasure.org",
          code: "Cel"
        }
      });
    }

    // Fréquence cardiaque
    if (vitals.frequence_cardiaque) {
      observations.push({
        resourceType: "Observation",
        id: uuidv4(),
        status: "final",
        category: [{
          coding: [{
            system: "http://terminology.hl7.org/CodeSystem/observation-category",
            code: "vital-signs"
          }]
        }],
        code: {
          coding: [{
            system: "http://loinc.org",
            code: "8867-4",
            display: "Heart rate"
          }]
        },
        subject: { reference: patientRef },
        effectiveDateTime: vitals.date,
        valueQuantity: {
          value: vitals.frequence_cardiaque,
          unit: "bpm",
          system: "http://unitsofmeasure.org",
          code: "/min"
        }
      });
    }

    // Poids (si grossesse)
    if (vitals.poids) {
      observations.push({
        resourceType: "Observation",
        id: uuidv4(),
        status: "final",
        category: [{
          coding: [{
            system: "http://terminology.hl7.org/CodeSystem/observation-category",
            code: "vital-signs"
          }]
        }],
        code: {
          coding: [{
            system: "http://loinc.org",
            code: "29463-7",
            display: "Body Weight"
          }]
        },
        subject: { reference: patientRef },
        effectiveDateTime: vitals.date,
        valueQuantity: {
          value: vitals.poids,
          unit: "kg",
          system: "http://unitsofmeasure.org",
          code: "kg"
        }
      });
    }

    return observations;
  }

  // Map RendezVous vers FHIR Appointment
  static toFHIRAppointment(rdv, professionnelId, patientEmail) {
    return {
      resourceType: "Appointment",
      id: rdv.id,
      status: this.mapAppointmentStatus(rdv.statut),
      serviceType: [{
        coding: [{
          system: "http://terminology.hl7.org/CodeSystem/service-type",
          code: this.mapConsultationType(rdv.type_consultation)
        }]
      }],
      appointmentType: {
        coding: [{
          system: "http://terminology.hl7.org/CodeSystem/v2-0276",
          code: "ROUTINE"
        }]
      },
      reasonCode: rdv.motif ? [{
        text: rdv.motif
      }] : [],
      description: rdv.notes_patient,
      start: rdv.date_rdv,
      participant: [
        {
          actor: {
            reference: `Practitioner/${professionnelId}`,
            display: "Professionnel de santé"
          },
          required: "required",
          status: "accepted"
        },
        {
          actor: {
            identifier: {
              value: patientEmail
            },
            display: "Patient"
          },
          required: "required",
          status: rdv.statut === "confirme" ? "accepted" : "tentative"
        }
      ],
      comment: rdv.notes_professionnel
    };
  }

  // Helpers
  static mapAppointmentStatus(statut) {
    const map = {
      "planifie": "booked",
      "confirme": "booked",
      "en_cours": "arrived",
      "termine": "fulfilled",
      "annule": "cancelled"
    };
    return map[statut] || "proposed";
  }

  static mapConsultationType(type) {
    const map = {
      "visio": "540",
      "telephone": "540",
      "cabinet": "124",
      "clinique": "124",
      "hopital": "124"
    };
    return map[type] || "124";
  }

  // From FHIR to AloMaman
  static fromFHIRObservation(observation) {
    const loincCode = observation.code?.coding?.find(c => c.system === "http://loinc.org")?.code;
    
    const loincMap = {
      "29463-7": "poids",
      "8302-2": "taille",
      "9843-4": "perimetre_cranien",
      "8310-5": "temperature",
      "8867-4": "frequence_cardiaque",
      "2339-0": "glucose"
    };

    return {
      type: loincMap[loincCode] || "autre",
      date: observation.effectiveDateTime,
      valeur: observation.valueQuantity?.value,
      unite: observation.valueQuantity?.unit,
      notes: observation.note?.[0]?.text
    };
  }

  // ============================================
  // FHIR -> ALOMAMAN: Reverse mappings
  // ============================================

  static fromFHIRPatient(fhirPatient) {
    const name = fhirPatient.name?.[0];
    const phone = fhirPatient.telecom?.find(t => t.system === 'phone');
    const email = fhirPatient.telecom?.find(t => t.system === 'email');
    const address = fhirPatient.address?.[0];

    return {
      nom_complet: name?.text || `${name?.given?.join(' ')} ${name?.family}`,
      telephone: phone?.value,
      date_naissance: fhirPatient.birthDate,
      adresse: address?.text,
      ville: address?.city,
      region: address?.district,
      langue_preferee: fhirPatient.communication?.[0]?.language?.coding?.[0]?.code === 'en' ? 'anglais' : 'francais',
      numero_cmu: fhirPatient.identifier?.find(i => i.system === 'urn:oid:ci:cmu')?.value,
      situation_familiale: fhirPatient.maritalStatus?.coding?.[0]?.code === 'M' ? 'mariee' : 'celibataire'
    };
  }

  static fromFHIRPractitioner(fhirPractitioner) {
    const name = fhirPractitioner.name?.[0];
    const phone = fhirPractitioner.telecom?.find(t => t.system === 'phone');
    const email = fhirPractitioner.telecom?.find(t => t.system === 'email');
    const address = fhirPractitioner.address?.[0];

    return {
      nom_complet: name?.text,
      telephone: phone?.value,
      email: email?.value,
      adresse: address?.text,
      ville: address?.city,
      region: address?.district,
      specialite: fhirPractitioner.qualification?.[0]?.code?.coding?.[0]?.display,
      numero_ordre: fhirPractitioner.identifier?.find(i => i.system === 'urn:oid:ci:ordre')?.value,
      compte_verifie: fhirPractitioner.active,
      photo: fhirPractitioner.photo?.[0]?.url
    };
  }

  static fromFHIROrganization(fhirOrg) {
    const phone = fhirOrg.telecom?.find(t => t.system === 'phone');
    const email = fhirOrg.telecom?.find(t => t.system === 'email');
    const address = fhirOrg.address?.[0];

    return {
      nom: fhirOrg.name,
      type_etablissement: fhirOrg.type?.[0]?.coding?.[0]?.code === 'prov' ? 'clinique_privee' : 'hopital_public',
      numero_agrement: fhirOrg.identifier?.find(i => i.system === 'urn:oid:ci:msp:agrement')?.value,
      telephone: phone?.value,
      email_contact: email?.value,
      adresse: address?.text,
      ville: address?.city,
      region: address?.district
    };
  }

  static fromFHIREncounter(fhirEncounter) {
    return {
      date_rdv: fhirEncounter.period?.start,
      statut: this.mapEncounterStatusFromFHIR(fhirEncounter.status),
      type_consultation: fhirEncounter.class?.code === 'VR' ? 'visio' : 'cabinet',
      motif: fhirEncounter.reasonCode?.[0]?.text,
      adresse_consultation: fhirEncounter.location?.[0]?.location?.display
    };
  }

  static mapEncounterStatusFromFHIR(status) {
    const map = {
      'planned': 'planifie',
      'in-progress': 'en_cours',
      'finished': 'termine',
      'cancelled': 'annule'
    };
    return map[status] || 'planifie';
  }

  static fromFHIRAppointment(appointment) {
    const statusMap = {
      "proposed": "planifie",
      "booked": "confirme",
      "arrived": "en_cours",
      "fulfilled": "termine",
      "cancelled": "annule"
    };

    const typeMap = {
      "540": "visio",
      "124": "cabinet"
    };

    const serviceTypeCode = appointment.serviceType?.[0]?.coding?.[0]?.code;

    return {
      statut: statusMap[appointment.status] || "planifie",
      type_consultation: typeMap[serviceTypeCode] || "cabinet",
      date_rdv: appointment.start,
      motif: appointment.reasonCode?.[0]?.text || "",
      notes_patient: appointment.description || "",
      notes_professionnel: appointment.comment || ""
    };
  }

  // ============================================
  // ALOMAMAN -> FHIR: CONDITION
  // ============================================
  static toFHIRCondition(antecedent, patientEmail, grossesse) {
    return {
      resourceType: 'Condition',
      id: uuidv4(),
      clinicalStatus: {
        coding: [{
          system: 'http://terminology.hl7.org/CodeSystem/condition-clinical',
          code: 'active'
        }]
      },
      verificationStatus: {
        coding: [{
          system: 'http://terminology.hl7.org/CodeSystem/condition-ver-status',
          code: 'confirmed'
        }]
      },
      category: [{
        coding: [{
          system: 'http://terminology.hl7.org/CodeSystem/condition-category',
          code: 'problem-list-item',
          display: 'Problem List Item'
        }]
      }],
      code: {
        coding: [{
          system: 'http://snomed.info/sct',
          display: antecedent
        }],
        text: antecedent
      },
      subject: {
        identifier: { value: patientEmail }
      },
      onsetDateTime: grossesse?.date_derniere_regle,
      recordedDate: new Date().toISOString(),
      note: [{
        text: `Antécédent signalé dans le cadre du suivi grossesse ID: ${grossesse?.id}`
      }]
    };
  }

  // ============================================
  // ALOMAMAN -> FHIR: PROCEDURE
  // ============================================
  static toFHIRProcedure(consultation, patientEmail) {
    return {
      resourceType: 'Procedure',
      id: uuidv4(),
      status: 'completed',
      category: {
        coding: [{
          system: 'http://snomed.info/sct',
          code: '386637004',
          display: 'Obstetric procedure'
        }]
      },
      code: {
        coding: [{
          system: 'http://snomed.info/sct',
          code: '424619006',
          display: 'Prenatal visit'
        }],
        text: consultation.type_consultation || 'Consultation prénatale'
      },
      subject: {
        identifier: { value: patientEmail }
      },
      performedDateTime: consultation.date,
      performer: consultation.professionnel_id ? [{
        actor: {
          reference: `Practitioner/${consultation.professionnel_id}`
        }
      }] : [],
      note: consultation.notes ? [{
        text: consultation.notes
      }] : [],
      outcome: consultation.diagnostic ? {
        text: consultation.diagnostic
      } : undefined
    };
  }

  // ============================================
  // ALOMAMAN -> FHIR: ADVERSE EVENT
  // ============================================
  static toFHIRAdverseEvent(effetSecondaire, patientEmail, suiviContraceptionId) {
    return {
      resourceType: 'AdverseEvent',
      id: uuidv4(),
      identifier: [{
        system: 'urn:oid:alomaman:adverse-event',
        value: uuidv4()
      }],
      actuality: 'actual',
      category: [{
        coding: [{
          system: 'http://terminology.hl7.org/CodeSystem/adverse-event-category',
          code: 'medication-mishap',
          display: 'Medication Mishap'
        }]
      }],
      event: {
        coding: [{
          system: 'http://snomed.info/sct',
          display: effetSecondaire.type
        }],
        text: effetSecondaire.type
      },
      subject: {
        identifier: { value: patientEmail }
      },
      date: effetSecondaire.date,
      seriousness: {
        coding: [{
          system: 'http://terminology.hl7.org/CodeSystem/adverse-event-seriousness',
          code: effetSecondaire.severite === 'severe' ? 'serious' : 'non-serious'
        }]
      },
      severity: {
        coding: [{
          system: 'http://terminology.hl7.org/CodeSystem/adverse-event-severity',
          code: effetSecondaire.severite === 'severe' ? 'severe' : effetSecondaire.severite === 'modere' ? 'moderate' : 'mild'
        }]
      },
      suspectEntity: [{
        instance: {
          display: `Contraception suivie - ID: ${suiviContraceptionId}`
        }
      }],
      resultingCondition: effetSecondaire.description ? [{
        display: effetSecondaire.description
      }] : []
    };
  }

  // ============================================
  // FHIR -> ALOMAMAN: Reverse mappings nouvelles ressources
  // ============================================

  static fromFHIRCondition(fhirCondition) {
    return {
      type: 'antecedent',
      nom: fhirCondition.code?.text || fhirCondition.code?.coding?.[0]?.display,
      date: fhirCondition.onsetDateTime || fhirCondition.recordedDate,
      statut: fhirCondition.clinicalStatus?.coding?.[0]?.code,
      notes: fhirCondition.note?.[0]?.text
    };
  }

  static fromFHIRProcedure(fhirProcedure) {
    return {
      type_consultation: fhirProcedure.code?.text,
      date: fhirProcedure.performedDateTime,
      professionnel_id: fhirProcedure.performer?.[0]?.actor?.reference?.split('/')?.[1],
      notes: fhirProcedure.note?.[0]?.text,
      diagnostic: fhirProcedure.outcome?.text
    };
  }

  static fromFHIRAdverseEvent(fhirAdverseEvent) {
    const severityMap = {
      'severe': 'severe',
      'moderate': 'modere',
      'mild': 'leger'
    };

    return {
      date: fhirAdverseEvent.date,
      type: fhirAdverseEvent.event?.text || fhirAdverseEvent.event?.coding?.[0]?.display,
      severite: severityMap[fhirAdverseEvent.severity?.coding?.[0]?.code] || 'leger',
      description: fhirAdverseEvent.resultingCondition?.[0]?.display || ''
    };
  }
  }

  export default FHIRMapper;