import React, { useState } from 'react';
import { Button } from '../ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { seedSupabaseDatabase } from '../../utils/supabaseSeedData';
import { Database, CheckCircle, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';

const SeedData = () => {
  const [seeding, setSeeding] = useState(false);
  const [seeded, setSeeded] = useState(false);

  const handleSeedDatabase = async () => {
    setSeeding(true);
    try {
      const success = await seedSupabaseDatabase();
      if (success) {
        setSeeded(true);
        toast.success('Database seeded successfully!');
      } else {
        toast.error('Failed to seed database');
      }
    } catch (error) {
      console.error('Seeding error:', error);
      toast.error('Error seeding database');
    } finally {
      setSeeding(false);
    }
  };

  return (
    <Card className="max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center">
          <Database className="h-5 w-5 mr-2" />
          Database Setup
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Click the button below to populate the database with sample data including schemes, contacts, and treatments.
          </p>
          
          {seeded ? (
            <div className="flex items-center p-3 bg-green-50 rounded-lg">
              <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
              <span className="text-green-800 text-sm">Database has been seeded successfully!</span>
            </div>
          ) : (
            <div className="flex items-center p-3 bg-yellow-50 rounded-lg">
              <AlertCircle className="h-5 w-5 text-yellow-500 mr-2" />
              <span className="text-yellow-800 text-sm">Database needs to be seeded with sample data</span>
            </div>
          )}
          
          <Button
            onClick={handleSeedDatabase}
            loading={seeding}
            disabled={seeded}
            className="w-full"
          >
            {seeding ? 'Seeding Database...' : seeded ? 'Database Seeded' : 'Seed Database'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default SeedData;