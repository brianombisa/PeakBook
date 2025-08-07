import React, { useState, useEffect } from 'react';
import { SubscriptionPlan } from '@/api/entities';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import { Plus, Edit, Trash2, Save, Star } from 'lucide-react';

export default function PlatformSettings() {
  const [plans, setPlans] = useState([]);
  const [editingPlan, setEditingPlan] = useState(null);
  const [isCreating, setIsCreating] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadPlans();
  }, []);

  const loadPlans = async () => {
    try {
      const allPlans = await SubscriptionPlan.list();
      setPlans(allPlans.sort((a, b) => a.price_monthly - b.price_monthly));
    } catch (error) {
      console.error('Error loading plans:', error);
      toast({
        title: 'Error',
        description: 'Could not load subscription plans.',
        variant: 'destructive'
      });
    }
  };

  const handleCreatePlan = () => {
    setEditingPlan({
      name: '',
      description: '',
      price_monthly: 0,
      price_annual: 0,
      features: [],
      is_active: true,
      is_featured: false
    });
    setIsCreating(true);
  };

  const handleEditPlan = (plan) => {
    setEditingPlan({ ...plan });
    setIsCreating(false);
  };

  const handleSavePlan = async () => {
    try {
      if (isCreating) {
        await SubscriptionPlan.create(editingPlan);
        toast({
          title: 'Success',
          description: 'Subscription plan created successfully.'
        });
      } else {
        await SubscriptionPlan.update(editingPlan.id, editingPlan);
        toast({
          title: 'Success',
          description: 'Subscription plan updated successfully.'
        });
      }
      
      setEditingPlan(null);
      setIsCreating(false);
      await loadPlans();
    } catch (error) {
      console.error('Error saving plan:', error);
      toast({
        title: 'Error',
        description: 'Could not save subscription plan.',
        variant: 'destructive'
      });
    }
  };

  const handleDeletePlan = async (planId) => {
    if (!confirm('Are you sure you want to delete this subscription plan?')) {
      return;
    }

    try {
      await SubscriptionPlan.delete(planId);
      toast({
        title: 'Success',
        description: 'Subscription plan deleted successfully.'
      });
      await loadPlans();
    } catch (error) {
      console.error('Error deleting plan:', error);
      toast({
        title: 'Error',
        description: 'Could not delete subscription plan.',
        variant: 'destructive'
      });
    }
  };

  const addFeature = () => {
    setEditingPlan({
      ...editingPlan,
      features: [...editingPlan.features, '']
    });
  };

  const updateFeature = (index, value) => {
    const updatedFeatures = [...editingPlan.features];
    updatedFeatures[index] = value;
    setEditingPlan({
      ...editingPlan,
      features: updatedFeatures
    });
  };

  const removeFeature = (index) => {
    const updatedFeatures = editingPlan.features.filter((_, i) => i !== index);
    setEditingPlan({
      ...editingPlan,
      features: updatedFeatures
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-white">Subscription Plans Management</h2>
        <Button onClick={handleCreatePlan} className="bg-green-600 hover:bg-green-700">
          <Plus className="w-4 h-4 mr-2" />
          Create New Plan
        </Button>
      </div>

      {editingPlan && (
        <Card className="bg-white/10 backdrop-blur-sm border-white/20">
          <CardHeader>
            <CardTitle className="text-white">
              {isCreating ? 'Create New Plan' : 'Edit Plan'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-slate-300 block mb-2">Plan Name</label>
                <Input
                  value={editingPlan.name}
                  onChange={(e) => setEditingPlan({ ...editingPlan, name: e.target.value })}
                  className="bg-white/10 border-white/20 text-white"
                  placeholder="e.g., Professional"
                />
              </div>
              <div>
                <label className="text-sm text-slate-300 block mb-2">Description</label>
                <Input
                  value={editingPlan.description}
                  onChange={(e) => setEditingPlan({ ...editingPlan, description: e.target.value })}
                  className="bg-white/10 border-white/20 text-white"
                  placeholder="Brief plan description"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-slate-300 block mb-2">Monthly Price (KES)</label>
                <Input
                  type="number"
                  value={editingPlan.price_monthly}
                  onChange={(e) => setEditingPlan({ ...editingPlan, price_monthly: parseFloat(e.target.value) })}
                  className="bg-white/10 border-white/20 text-white"
                />
              </div>
              <div>
                <label className="text-sm text-slate-300 block mb-2">Annual Price (KES)</label>
                <Input
                  type="number"
                  value={editingPlan.price_annual}
                  onChange={(e) => setEditingPlan({ ...editingPlan, price_annual: parseFloat(e.target.value) })}
                  className="bg-white/10 border-white/20 text-white"
                />
              </div>
            </div>

            <div>
              <label className="text-sm text-slate-300 block mb-2">Features</label>
              <div className="space-y-2">
                {editingPlan.features.map((feature, index) => (
                  <div key={index} className="flex gap-2">
                    <Input
                      value={feature}
                      onChange={(e) => updateFeature(index, e.target.value)}
                      className="bg-white/10 border-white/20 text-white flex-1"
                      placeholder="Enter feature description"
                    />
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => removeFeature(index)}
                      className="border-white/20 text-white hover:bg-red-600"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
                <Button
                  variant="outline"
                  onClick={addFeature}
                  className="border-white/20 text-white hover:bg-white/20"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Feature
                </Button>
              </div>
            </div>

            <div className="flex items-center space-x-6">
              <div className="flex items-center space-x-2">
                <Switch
                  checked={editingPlan.is_active}
                  onCheckedChange={(checked) => setEditingPlan({ ...editingPlan, is_active: checked })}
                />
                <span className="text-white">Active Plan</span>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  checked={editingPlan.is_featured}
                  onCheckedChange={(checked) => setEditingPlan({ ...editingPlan, is_featured: checked })}
                />
                <span className="text-white">Featured Plan</span>
              </div>
            </div>

            <div className="flex justify-end space-x-2">
              <Button
                variant="outline"
                onClick={() => {
                  setEditingPlan(null);
                  setIsCreating(false);
                }}
                className="border-white/20 text-white hover:bg-white/20"
              >
                Cancel
              </Button>
              <Button onClick={handleSavePlan} className="bg-blue-600 hover:bg-blue-700">
                <Save className="w-4 h-4 mr-2" />
                Save Plan
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Plans List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {plans.map((plan) => (
          <Card key={plan.id} className="bg-white/10 backdrop-blur-sm border-white/20 relative">
            {plan.is_featured && (
              <div className="absolute -top-3 -right-3">
                <Badge className="bg-yellow-500 text-yellow-900">
                  <Star className="w-3 h-3 mr-1" />
                  Featured
                </Badge>
              </div>
            )}
            <CardHeader>
              <CardTitle className="text-white flex justify-between items-center">
                <span>{plan.name}</span>
                <Badge className={plan.is_active ? 'bg-green-600' : 'bg-red-600'}>
                  {plan.is_active ? 'Active' : 'Inactive'}
                </Badge>
              </CardTitle>
              <p className="text-slate-300 text-sm">{plan.description}</p>
            </CardHeader>
            <CardContent>
              <div className="mb-4">
                <div className="text-2xl font-bold text-white">
                  KES {plan.price_monthly?.toLocaleString()}/month
                </div>
                <div className="text-sm text-slate-300">
                  KES {plan.price_annual?.toLocaleString()}/year
                </div>
              </div>
              
              <div className="mb-4">
                <h4 className="text-white font-semibold mb-2">Features:</h4>
                <ul className="text-sm text-slate-300 space-y-1">
                  {plan.features?.slice(0, 3).map((feature, index) => (
                    <li key={index}>• {feature}</li>
                  ))}
                  {plan.features?.length > 3 && (
                    <li>• And {plan.features.length - 3} more features...</li>
                  )}
                </ul>
              </div>

              <div className="flex justify-end space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleEditPlan(plan)}
                  className="border-white/20 text-white hover:bg-white/20"
                >
                  <Edit className="w-4 h-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDeletePlan(plan.id)}
                  className="border-red-500 text-red-500 hover:bg-red-600 hover:text-white"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}