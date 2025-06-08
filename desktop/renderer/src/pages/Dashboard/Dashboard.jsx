import React, { useEffect, useState } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Users, 
  Package, 
  FileText,
  AlertTriangle,
  CheckCircle
} from 'lucide-react';
import { useElectronAPI } from '../../hooks/useElectronAPI';
import { useAppStore } from '../../stores/appStore';

const Dashboard = () => {
  const [dashboardData, setDashboardData] = useState({
    metrics: {
      totalRevenue: 0,
      totalCustomers: 0,
      totalProducts: 0,
      totalVouchers: 0
    },
    recentActivity: [],
    alerts: []
  });
  const [loading, setLoading] = useState(true);
  
  const electronAPI = useElectronAPI();
  const { isOnline, syncStatus } = useAppStore();

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      // Load basic metrics
      const [companies, vouchers, parties, inventory] = await Promise.all([
        electronAPI?.api?.companies?.getAll() || [],
        electronAPI?.api?.vouchers?.getAll() || [],
        electronAPI?.api?.parties?.getAll() || [],
        electronAPI?.api?.inventory?.getAll() || []
      ]);

      // Calculate metrics
      const totalRevenue = vouchers
        .filter(v => v.voucherType === 'Sales')
        .reduce((sum, v) => sum + (v.amount || 0), 0);

      setDashboardData({
        metrics: {
          totalRevenue,
          totalCustomers: parties.filter(p => p.partyType === 'Customer').length,
          totalProducts: inventory.length,
          totalVouchers: vouchers.length
        },
        recentActivity: vouchers.slice(0, 5).map(v => ({
          id: v.id,
          type: v.voucherType,
          amount: v.amount,
          party: v.partyName,
          date: v.date
        })),
        alerts: [
          {
            id: 1,
            type: 'warning',
            message: 'Low stock alert for 3 items',
            action: 'View Inventory'
          },
          {
            id: 2,
            type: 'info',
            message: '5 pending vouchers require approval',
            action: 'Review Vouchers'
          }
        ]
      });
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const MetricCard = ({ title, value, icon: Icon, trend, color = 'blue' }) => (
    <div className="bg-white rounded-lg shadow-soft p-6 border border-gray-200">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">
            {typeof value === 'number' && title.includes('Revenue') 
              ? `₹${value.toLocaleString()}`
              : value.toLocaleString()
            }
          </p>
          {trend && (
            <div className={`flex items-center mt-2 text-sm ${
              trend > 0 ? 'text-green-600' : 'text-red-600'
            }`}>
              {trend > 0 ? (
                <TrendingUp className="w-4 h-4 mr-1" />
              ) : (
                <TrendingDown className="w-4 h-4 mr-1" />
              )}
              {Math.abs(trend)}% from last month
            </div>
          )}
        </div>
        <div className={`p-3 rounded-full bg-${color}-100`}>
          <Icon className={`w-6 h-6 text-${color}-600`} />
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600">Welcome back! Here's what's happening with your business.</p>
        </div>
        
        {/* Sync Status */}
        <div className="flex items-center space-x-2">
          {syncStatus.status === 'completed' && (
            <div className="flex items-center space-x-2 text-green-600">
              <CheckCircle className="w-5 h-5" />
              <span className="text-sm">Synced</span>
            </div>
          )}
          {!isOnline && (
            <div className="flex items-center space-x-2 text-yellow-600">
              <AlertTriangle className="w-5 h-5" />
              <span className="text-sm">Offline Mode</span>
            </div>
          )}
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Total Revenue"
          value={dashboardData.metrics.totalRevenue}
          icon={DollarSign}
          trend={12.5}
          color="green"
        />
        <MetricCard
          title="Total Customers"
          value={dashboardData.metrics.totalCustomers}
          icon={Users}
          trend={8.2}
          color="blue"
        />
        <MetricCard
          title="Products"
          value={dashboardData.metrics.totalProducts}
          icon={Package}
          trend={-2.1}
          color="purple"
        />
        <MetricCard
          title="Vouchers"
          value={dashboardData.metrics.totalVouchers}
          icon={FileText}
          trend={15.3}
          color="orange"
        />
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Activity */}
        <div className="lg:col-span-2 bg-white rounded-lg shadow-soft border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Recent Activity</h3>
          </div>
          <div className="p-6">
            {dashboardData.recentActivity.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No recent activity</p>
            ) : (
              <div className="space-y-4">
                {dashboardData.recentActivity.map((activity) => (
                  <div key={activity.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                        <FileText className="w-4 h-4 text-blue-600" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{activity.type} Voucher</p>
                        <p className="text-sm text-gray-600">{activity.party}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-gray-900">₹{activity.amount?.toLocaleString()}</p>
                      <p className="text-sm text-gray-600">
                        {new Date(activity.date).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Alerts & Notifications */}
        <div className="bg-white rounded-lg shadow-soft border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Alerts</h3>
          </div>
          <div className="p-6">
            {dashboardData.alerts.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No alerts</p>
            ) : (
              <div className="space-y-4">
                {dashboardData.alerts.map((alert) => (
                  <div key={alert.id} className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <div className="flex items-start space-x-3">
                      <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5" />
                      <div className="flex-1">
                        <p className="text-sm text-yellow-800">{alert.message}</p>
                        <button className="text-sm text-yellow-700 hover:text-yellow-800 font-medium mt-1">
                          {alert.action}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow-soft border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <button className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
            <FileText className="w-6 h-6 text-blue-600 mx-auto mb-2" />
            <span className="text-sm font-medium text-gray-900">New Voucher</span>
          </button>
          <button className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
            <Users className="w-6 h-6 text-green-600 mx-auto mb-2" />
            <span className="text-sm font-medium text-gray-900">Add Customer</span>
          </button>
          <button className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
            <Package className="w-6 h-6 text-purple-600 mx-auto mb-2" />
            <span className="text-sm font-medium text-gray-900">Add Product</span>
          </button>
          <button className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
            <TrendingUp className="w-6 h-6 text-orange-600 mx-auto mb-2" />
            <span className="text-sm font-medium text-gray-900">View Reports</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
