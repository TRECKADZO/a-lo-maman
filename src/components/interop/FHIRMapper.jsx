import { v4 as uuidv4 } from 'uuid';

/**
 * Service de mapping entre entités AloMaman et ressources FHIR R4
 */
export class FHIRMapper {
  
  // Map ProfilMaman/User vers FHIR Patient
  static toFHIRPatient(profil, user) {
    return {
      resourceType: "Patient",
      id: user.id,
      identifier: [
        {
          system: "https://alomaman.ci/patient-id",
          value: user.id
        }
      ],
      active: true,
      name: [
        {
          use: "official",
          family: profil.nom_complet?.split(' ').pop() || '',
          given: profil.nom_complet?.split(' ').slice(0, -1) || []
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
      address: profil.ville ? [
        {
          use: "home",
          city: profil.ville,
          district: profil.region,
          country: "CI"
        }
      ] : [],
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

  // From FHIR Appointment to AloMaman RendezVous
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
}

export default FHIRMapper;