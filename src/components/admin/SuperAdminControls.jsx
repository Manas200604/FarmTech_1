import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { Button } from '../ui/Button';
import { useAuth } from '../../contexts/FastAuthContext';
import toast from 'react-hot-toast';
import {
  Shield, Crown, Users, Database, Settings, Trash2, 
  Download, Upload, Eye, Lock, AlertTriangle, CheckCircle,
  BarChart3, FileText, Zap, Server
} from 'lucide-react';

const SuperAdminControls = () => {
  const { userProfile, isSuperAdmin, canDeleteData, canModifySystem, canManageUsers } = useAuth();
  const [loading, setLoading] = useState(false);

  if (!isSuperAdmin()) {
    return null;
  }

  const handleSystemAction = async (action, confirmMessage) => {
    if (!confirm(confirmMessage)) return;
    
    setLoading(true);
    try {
      // Simulate system action
      await new Promise(resolve => setTimeout(resolve, 1000));
      toast.success(`${action} completed successfully`);
    } catch (error) {
      toast.error(`Failed to ${action.toLowerCase()}`);
    } finally {
      setLoading(false);
    }
  };

  const systemActions = [
    {
      title: 'User Management',
      icon: Users,
      description: 'Manage all user accounts and permissions',
      actions: [
        { name: 'View All Users', icon: Eye, color: 'blue' },
        { name: 'Delete Users', icon: Trash2, color: 'red', requiresConfirm: true },
        { name: 'Modify Roles', icon: Shield, color: 'purple' },
        { name: 'Reset Passwords', icon: Lock, color: 'orange' }
      ]
    },
    {
      title: 'Data Management',
      icon: Database,
      description: 'Complete control over all system data',
      actions: [
        { name: 'Export All Data', icon: Download, color: 'green' },
        { name: 'Import Data', icon: Upload, color: 'blue' },
        { name: 'Delete Data', icon: Trash2, color: 'red', requiresConfirm: true },
        { name: 'Database Backup', icon: Server, color: 'purple' }
      ]
    },
    {
      title: 'System Administration',
      icon: Settings,
      description: 'System configuration and maintenance',
      actions: [
        { name: 'System Settings', icon: Settings, color: 'gray' },
        { name: 'Performance Monitor', icon: BarChart3, color: 'green' },
        { name: 'Security Config', icon: Lock, color: 'red' },
        { name: 'System Override', icon: Zap, color: 'yellow' }
      ]
    },
    {
      title: 'Audit & Compliance',
      icon: FileText,
      description: 'Audit trails and compliance monitoring',
      actions: [
        { name: 'View Audit Logs', icon: Eye, color: 'blue' },
        { name: 'Generate Reports', icon: FileText, color: 'green' },
        { name: 'Compliance Check', icon: CheckCircle, color: 'green' },
        { name: 'Security Audit', icon: Shield, color: 'red' }
      ]
    }
  ];

  return (
    <div className="space-y-6">
      {/* Super Admin Header */}
      <Card className="border-yellow-200 bg-gradient-to-r from-yellow-50 to-orange-50">
        <CardHeader>
          <div className="flex items-center space-x-3">
            <Crown className="h-8 w-8 text-yellow-600" />
            <div>
              <CardTitle className="text-yellow-800">Super Administrator Controls</CardTitle>
              <p className="text-sm text-yellow-700 mt-1">
                Complete system control for {userProfile?.email}
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-2">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
              <p className="text-sm font-medium text-gray-900">Full Access</p>
              <p className="text-xs text-gray-600">All Features</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-2">
                <Trash2 className="h-6 w-6 text-red-600" />
              </div>
              <p className="text-sm font-medium text-gray-900">Delete Power</p>
              <p className="text-xs text-gray-600">Any Data</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-2">
                <Settings className="h-6 w-6 text-purple-600" />
              </div>
              <p className="text-sm font-medium text-gray-900">System Config</p>
              <p className="text-xs text-gray-600">All Settings</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-2">
                <Shield className="h-6 w-6 text-blue-600" />
              </div>
              <p className="text-sm font-medium text-gray-900">Override</p>
              <p className="text-xs text-gray-600">Any Restriction</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* System Action Panels */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {systemActions.map((section, index) => {
          const Icon = section.icon;
          return (
            <Card key={index} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-center space-x-3">
                  <Icon className="h-6 w-6 text-gray-600" />
                  <div>
                    <CardTitle className="text-lg">{section.title}</CardTitle>
                    <p className="text-sm text-gray-600 mt-1">{section.description}</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-3">
                  {section.actions.map((action, actionIndex) => {
                    const ActionIcon = action.icon;
                    const colorClasses = {
                      blue: 'bg-blue-50 text-blue-700 hover:bg-blue-100 border-blue-200',
                      green: 'bg-green-50 text-green-700 hover:bg-green-100 border-green-200',
                      red: 'bg-red-50 text-red-700 hover:bg-red-100 border-red-200',
                      purple: 'bg-purple-50 text-purple-700 hover:bg-purple-100 border-purple-200',
                      orange: 'bg-orange-50 text-orange-700 hover:bg-orange-100 border-orange-200',
                      yellow: 'bg-yellow-50 text-yellow-700 hover:bg-yellow-100 border-yellow-200',
                      gray: 'bg-gray-50 text-gray-700 hover:bg-gray-100 border-gray-200'
                    };

                    return (
                      <Button
                        key={actionIndex}
                        variant="outline"
                        size="sm"
                        className={`h-auto p-3 flex flex-col items-center space-y-2 ${colorClasses[action.color]}`}
                        onClick={() => handleSystemAction(
                          action.name,
                          action.requiresConfirm 
                            ? `Are you sure you want to ${action.name.toLowerCase()}? This action may be irreversible.`
                            : `Execute ${action.name}?`
                        )}
                        disabled={loading}
                      >
                        <ActionIcon className="h-5 w-5" />
                        <span className="text-xs font-medium text-center leading-tight">
                          {action.name}
                        </span>
                      </Button>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Warning Panel */}
      <Card className="border-red-200 bg-red-50">
        <CardContent className="p-4">
          <div className="flex items-start space-x-3">
            <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5" />
            <div>
              <h4 className="text-sm font-semibold text-red-800">Super Admin Warning</h4>
              <p className="text-xs text-red-700 mt-1">
                You have complete system control. Use these powers responsibly. 
                All actions are logged and audited for security purposes.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SuperAdminControls;