import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Non authentifié' }, { status: 401 });
    }

    // Récupérer toutes les données de l'utilisateur
    const [profilMaman, grossesses, enfants, rendezVous, documents, consultations] = await Promise.all([
      base44.entities.ProfilMaman.filter({ created_by: user.email }).catch(() => []),
      base44.entities.SuiviGrossesse.filter({ created_by: user.email }).catch(() => []),
      base44.entities.EnfantCarnet.filter({ created_by: user.email }).catch(() => []),
      base44.entities.RendezVous.filter({ created_by: user.email }).catch(() => []),
      base44.entities.DocumentMedical.filter({ created_by: user.email }).catch(() => []),
      base44.entities.SuiviGrossesse.filter({ created_by: user.email }).catch(() => [])
    ]);

    const profil = profilMaman[0];

    // Construire le bundle FHIR R4
    const bundle = {
      resourceType: "Bundle",
      type: "collection",
      timestamp: new Date().toISOString(),
      entry: []
    };

    // Patient Resource
    if (profil) {
      bundle.entry.push({
        fullUrl: `urn:uuid:patient-${user.email}`,
        resource: {
          resourceType: "Patient",
          id: profil.id,
          identifier: [
            {
              system: "urn:oid:1.2.250.1.213.1.4.8",
              value: profil.numero_cmu || "N/A"
            }
          ],
          name: [
            {
              use: "official",
              text: profil.display_name || user.full_name,
              family: profil.display_name?.split(' ')[1] || user.full_name?.split(' ')[1] || "",
              given: [profil.display_name?.split(' ')[0] || user.full_name?.split(' ')[0] || ""]
            }
          ],
          telecom: profil.telephone ? [
            {
              system: "phone",
              value: profil.telephone,
              use: "mobile"
            }
          ] : [],
          gender: "female",
          birthDate: profil.date_naissance || null,
          address: profil.ville || profil.region ? [
            {
              use: "home",
              city: profil.ville,
              district: profil.region,
              country: "CI"
            }
          ] : [],
          maritalStatus: profil.situation_familiale ? {
            coding: [
              {
                system: "http://terminology.hl7.org/CodeSystem/v3-MaritalStatus",
                code: profil.situation_familiale === "mariee" ? "M" : "S"
              }
            ]
          } : null
        }
      });
    }

    // Observations - Groupe sanguin
    if (profil?.groupe_sanguin) {
      bundle.entry.push({
        fullUrl: `urn:uuid:observation-bloodtype-${profil.id}`,
        resource: {
          resourceType: "Observation",
          id: `bloodtype-${profil.id}`,
          status: "final",
          category: [
            {
              coding: [
                {
                  system: "http://terminology.hl7.org/CodeSystem/observation-category",
                  code: "laboratory"
                }
              ]
            }
          ],
          code: {
            coding: [
              {
                system: "http://loinc.org",
                code: "882-1",
                display: "ABO and Rh group"
              }
            ]
          },
          subject: {
            reference: `urn:uuid:patient-${user.email}`
          },
          valueString: profil.groupe_sanguin
        }
      });
    }

    // AllergyIntolerance
    if (profil?.allergies && profil.allergies.length > 0) {
      profil.allergies.forEach((allergie, idx) => {
        bundle.entry.push({
          fullUrl: `urn:uuid:allergy-${profil.id}-${idx}`,
          resource: {
            resourceType: "AllergyIntolerance",
            id: `allergy-${profil.id}-${idx}`,
            clinicalStatus: {
              coding: [
                {
                  system: "http://terminology.hl7.org/CodeSystem/allergyintolerance-clinical",
                  code: "active"
                }
              ]
            },
            verificationStatus: {
              coding: [
                {
                  system: "http://terminology.hl7.org/CodeSystem/allergyintolerance-verification",
                  code: "confirmed"
                }
              ]
            },
            type: "allergy",
            patient: {
              reference: `urn:uuid:patient-${user.email}`
            },
            recordedDate: new Date().toISOString(),
            reaction: [
              {
                substance: {
                  text: allergie
                }
              }
            ]
          }
        });
      });
    }

    // Conditions - Maladies chroniques
    if (profil?.maladies_chroniques && profil.maladies_chroniques.length > 0) {
      profil.maladies_chroniques.forEach((maladie, idx) => {
        bundle.entry.push({
          fullUrl: `urn:uuid:condition-${profil.id}-${idx}`,
          resource: {
            resourceType: "Condition",
            id: `condition-${profil.id}-${idx}`,
            clinicalStatus: {
              coding: [
                {
                  system: "http://terminology.hl7.org/CodeSystem/condition-clinical",
                  code: "active"
                }
              ]
            },
            verificationStatus: {
              coding: [
                {
                  system: "http://terminology.hl7.org/CodeSystem/condition-ver-status",
                  code: "confirmed"
                }
              ]
            },
            category: [
              {
                coding: [
                  {
                    system: "http://terminology.hl7.org/CodeSystem/condition-category",
                    code: "problem-list-item"
                  }
                ]
              }
            ],
            code: {
              text: maladie
            },
            subject: {
              reference: `urn:uuid:patient-${user.email}`
            }
          }
        });
      });
    }

    // Grossesses - Observation
    grossesses.forEach((grossesse) => {
      if (grossesse.grossesse_active) {
        bundle.entry.push({
          fullUrl: `urn:uuid:pregnancy-${grossesse.id}`,
          resource: {
            resourceType: "Observation",
            id: `pregnancy-${grossesse.id}`,
            status: "final",
            category: [
              {
                coding: [
                  {
                    system: "http://terminology.hl7.org/CodeSystem/observation-category",
                    code: "survey"
                  }
                ]
              }
            ],
            code: {
              coding: [
                {
                  system: "http://loinc.org",
                  code: "82810-3",
                  display: "Pregnancy status"
                }
              ]
            },
            subject: {
              reference: `urn:uuid:patient-${user.email}`
            },
            effectiveDateTime: grossesse.date_derniere_regle,
            valueCodeableConcept: {
              coding: [
                {
                  system: "http://snomed.info/sct",
                  code: "77386006",
                  display: "Pregnancy"
                }
              ]
            },
            component: [
              {
                code: {
                  text: "Date probable d'accouchement"
                },
                valueDateTime: grossesse.date_accouchement_prevue
              },
              {
                code: {
                  text: "Type de grossesse"
                },
                valueString: grossesse.type_grossesse
              }
            ]
          }
        });
      }
    });

    // Enfants - Patient Resources
    enfants.forEach((enfant) => {
      bundle.entry.push({
        fullUrl: `urn:uuid:child-${enfant.id}`,
        resource: {
          resourceType: "Patient",
          id: enfant.id,
          identifier: [
            {
              system: "urn:oid:1.2.250.1.213.1.4.8",
              value: enfant.numero_cmu || "N/A"
            }
          ],
          name: [
            {
              use: "official",
              text: enfant.nom_complet,
              given: [enfant.prenom],
              family: enfant.nom
            }
          ],
          gender: enfant.sexe === "masculin" ? "male" : "female",
          birthDate: enfant.date_naissance,
          link: [
            {
              other: {
                reference: `urn:uuid:patient-${user.email}`
              },
              type: "seealso"
            }
          ]
        }
      });

      // Vaccinations de l'enfant
      if (enfant.vaccins && enfant.vaccins.length > 0) {
        enfant.vaccins.forEach((vaccin, idx) => {
          bundle.entry.push({
            fullUrl: `urn:uuid:immunization-${enfant.id}-${idx}`,
            resource: {
              resourceType: "Immunization",
              id: `immunization-${enfant.id}-${idx}`,
              status: "completed",
              vaccineCode: {
                text: vaccin.nom_vaccin
              },
              patient: {
                reference: `urn:uuid:child-${enfant.id}`
              },
              occurrenceDateTime: vaccin.date_administration,
              location: vaccin.lieu ? {
                display: vaccin.lieu
              } : null
            }
          });
        });
      }
    });

    // Rendez-vous - Appointment
    rendezVous.slice(0, 20).forEach((rdv) => {
      bundle.entry.push({
        fullUrl: `urn:uuid:appointment-${rdv.id}`,
        resource: {
          resourceType: "Appointment",
          id: rdv.id,
          status: rdv.statut === "confirme" ? "booked" : (rdv.statut === "termine" ? "fulfilled" : "pending"),
          appointmentType: {
            text: rdv.type_consultation
          },
          description: rdv.motif,
          start: rdv.date_rdv,
          participant: [
            {
              actor: {
                reference: `urn:uuid:patient-${user.email}`,
                display: user.full_name
              },
              status: "accepted"
            }
          ]
        }
      });
    });

    // Retourner le bundle FHIR
    return new Response(JSON.stringify(bundle, null, 2), {
      headers: {
        'Content-Type': 'application/fhir+json',
        'Content-Disposition': `attachment; filename="export-fhir-${user.email}-${Date.now()}.json"`
      }
    });

  } catch (error) {
    console.error('Erreur export FHIR:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});