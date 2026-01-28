import React, { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Users, Calendar, Activity, Clock, FileText, AlertCircle } from 'lucide-react';
import { format, isToday, isTomorrow, addDays } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function AccesRapidePatients({ patients, appointments, medicalRecords }) {
  const [activeTab, setActiveTab] = useState('upcoming');

  const patientData = useMemo(() => {
    // Patients avec RDV aujourd'hui
    const todayAppointments = appointments.filter(apt => 
      isToday(new Date(apt.date_rdv)) && apt.statut !== 'annule'
    );

    const patientsToday = todayAppointments.map(apt => {
      const patient = patients.find(p => 
        p.created_by === apt.patient_email || p.created_by === apt.created_by
      );
      return {
        ...patient,
        appointment: apt,
        priority: 'today'
      };
    }).filter(Boolean);

    // Patients avec RDV demain
    const tomorrowAppointments = appointments.filter(apt => 
      isTomorrow(new Date(apt.date_rdv)) && apt.statut !== 'annule'
    );

    const patientsTomorrow = tomorrowAppointments.map(apt => {
      const patient = patients.find(p => 
        p.created_by === apt.patient_email || p.created_by === apt.created_by
      );
      return {
        ...patient,
        appointment: apt,
        priority: 'tomorrow'
      };
    }).filter(Boolean);

    // Patients avec RDV dans les 7 prochains jours
    const upcomingAppointments = appointments.filter(apt => {
      const aptDate = new Date(apt.date_rdv);
      const inSevenDays = addDays(new Date(), 7);
      return aptDate > new Date() && aptDate <= inSevenDays && apt.statut !== 'annule';
    }).sort((a, b) => new Date(a.date_rdv) - new Date(b.date_rdv));

    const patientsUpcoming = upcomingAppointments.map(apt => {
      const patient = patients.find(p => 
        p.created_by === apt.patient_email || p.created_by === apt.created_by
      );
      return {
        ...patient,
        appointment: apt,
        priority: 'upcoming'
      };
    }).filter(Boolean);

    // Patients récemment actifs (dernières consultations)
    const recentAppointments = appointments
      .filter(apt => apt.statut === 'termine')
      .sort((a, b) => new Date(b.date_rdv) - new Date(a.date_rdv))
      .slice(0, 10);

    const recentPatients = recentAppointments.map(apt => {
      const patient = patients.find(p => 
        p.created_by === apt.patient_email || p.created_by === apt.created_by
      );
      return {
        ...patient,
        lastAppointment: apt,
        priority: 'recent'
      };
    }).filter(Boolean);

    // Patients nécessitant attention (allergies, maladies chroniques)
    const patientsNeedingAttention = patients.filter(patient => 
      (patient.allergies && patient.allergies.length > 0) ||
      (patient.maladies_chroniques && patient.maladies_chroniques.length > 0)
    ).slice(0, 10);

    return {
      patientsToday,
      patientsTomorrow,
      patientsUpcoming,
      recentPatients,
      patientsNeedingAttention
    };
  }, [patients, appointments]);

  const PatientCard = ({ patient, showAppointment = false }) => {
    const calculateAge = (birthDate) => {
      if (!birthDate) return null;
      const today = new Date();
      const birth = new Date(birthDate);
      let age = today.getFullYear() - birth.getFullYear();
      const monthDiff = today.getMonth() - birth.getMonth();
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
        age--;
      }
      return age;
    };

    const age = calculateAge(patient.date_naissance);

    return (
      <Card className="hover:shadow-md transition-shadow">
        <CardContent className="p-4">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <h4 className="font-semibold text-gray-800">
                  {patient.prenom} {patient.nom}
                </h4>
                {age !== null && (
                  <Badge variant="outline" className="text-xs">
                    {age < 2 ? `${Math.floor(age * 12)} mois` : `${age} ans`}
                  </Badge>
                )}
              </div>

              {patient.allergies && patient.allergies.length > 0 && (
                <div className="flex items-center gap-1 mb-2">
                  <AlertCircle className="w-3 h-3 text-red-500" />
                  <span className="text-xs text-red-600">
                    {patient.allergies.length} allergie(s)
                  </span>
                </div>
              )}

              {patient.maladies_chroniques && patient.maladies_chroniques.length > 0 && (
                <div className="flex items-center gap-1 mb-2">
                  <Activity className="w-3 h-3 text-orange-500" />
                  <span className="text-xs text-orange-600">
                    {patient.maladies_chroniques.length} condition(s) chronique(s)
                  </span>
                </div>
              )}

              {showAppointment && patient.appointment && (
                <div className="mt-2 p-2 bg-teal-50 rounded text-xs">
                  <div className="flex items-center gap-1 text-teal-700">
                    <Calendar className="w-3 h-3" />
                    <span className="font-medium">
                      {format(new Date(patient.appointment.date_rdv), 'HH:mm', { locale: fr })}
                    </span>
                    <span className="mx-1">•</span>
                    <span>{patient.appointment.type_consultation}</span>
                  </div>
                  {patient.appointment.motif && (
                    <p className="text-gray-600 mt-1">{patient.appointment.motif}</p>
                  )}
                </div>
              )}

              {patient.lastAppointment && (
                <div className="mt-2 text-xs text-gray-500">
                  Dernière consultation: {format(new Date(patient.lastAppointment.date_rdv), 'dd MMM yyyy', { locale: fr })}
                </div>
              )}
            </div>

            <Button asChild size="sm" variant="outline">
              <Link to={createPageUrl(`DossierPatient?id=${patient.id}`)}>
                <FileText className="w-3 h-3 mr-1" />
                Dossier
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="w-5 h-5 text-blue-600" />
          Accès rapide aux patients
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4 mb-4">
            <TabsTrigger value="upcoming" className="text-xs">
              À venir ({patientData.patientsUpcoming.length})
            </TabsTrigger>
            <TabsTrigger value="today" className="text-xs">
              Aujourd'hui ({patientData.patientsToday.length})
            </TabsTrigger>
            <TabsTrigger value="recent" className="text-xs">
              Récents ({patientData.recentPatients.length})
            </TabsTrigger>
            <TabsTrigger value="attention" className="text-xs">
              Attention ({patientData.patientsNeedingAttention.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="today" className="space-y-3 max-h-[600px] overflow-y-auto">
            {patientData.patientsToday.length > 0 ? (
              patientData.patientsToday.map(patient => (
                <PatientCard key={patient.id} patient={patient} showAppointment />
              ))
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Calendar className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                <p>Aucun rendez-vous aujourd'hui</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="upcoming" className="space-y-3 max-h-[600px] overflow-y-auto">
            {patientData.patientsUpcoming.length > 0 ? (
              patientData.patientsUpcoming.map(patient => (
                <PatientCard key={patient.id} patient={patient} showAppointment />
              ))
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Clock className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                <p>Aucun rendez-vous à venir dans les 7 prochains jours</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="recent" className="space-y-3 max-h-[600px] overflow-y-auto">
            {patientData.recentPatients.length > 0 ? (
              patientData.recentPatients.map(patient => (
                <PatientCard key={patient.id} patient={patient} />
              ))
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Activity className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                <p>Aucune consultation récente</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="attention" className="space-y-3 max-h-[600px] overflow-y-auto">
            {patientData.patientsNeedingAttention.length > 0 ? (
              patientData.patientsNeedingAttention.map(patient => (
                <PatientCard key={patient.id} patient={patient} />
              ))
            ) : (
              <div className="text-center py-8 text-gray-500">
                <AlertCircle className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                <p>Aucun patient nécessitant une attention particulière</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}