import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Plus, 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  BarChart3, 
  History,
  Wallet,
  ArrowUpRight,
  ArrowDownRight,
  RefreshCw
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import { usePaperAccounts, usePaperPortfolio, usePaperOrders, useCreatePaperAccount, usePlacePaperOrder } from '@/hooks/usePaperTrading';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useNavigate } from 'react-router-dom';

export default function PaperTrading() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: accounts, isLoading: accountsLoading } = usePaperAccounts();
  const createAccount = useCreatePaperAccount();
  
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null);
  const [newAccountName, setNewAccountName] = useState('');
  const [newAccountBalance, setNewAccountBalance] = useState(100000);
  const [orderDialogOpen, setOrderDialogOpen] = useState(false);
  const [orderTicker, setOrderTicker] = useState('');
  const [orderSide, setOrderSide] = useState<'buy' | 'sell'>('buy');
  const [orderQuantity, setOrderQuantity] = useState('');

  const { data: portfolio, isLoading: portfolioLoading, refetch: refetchPortfolio } = usePaperPortfolio(selectedAccountId);
  const { data: orders } = usePaperOrders(selectedAccountId);
  const placeOrder = usePlacePaperOrder();

  // Auto-select first account
  React.useEffect(() => {
    if (accounts && accounts.length > 0 && !selectedAccountId) {
      setSelectedAccountId(accounts[0].id);
    }
  }, [accounts, selectedAccountId]);

  const handleCreateAccount = async () => {
    await createAccount.mutateAsync({
      name: newAccountName || 'Paper Portfolio',
      startingBalance: newAccountBalance,
    });
    setNewAccountName('');
  };

  const handlePlaceOrder = async () => {
    if (!selectedAccountId || !orderTicker || !orderQuantity) return;
    
    await placeOrder.mutateAsync({
      accountId: selectedAccountId,
      ticker: orderTicker.toUpperCase(),
      side: orderSide,
      quantity: parseFloat(orderQuantity),
    });
    
    setOrderDialogOpen(false);
    setOrderTicker('');
    setOrderQuantity('');
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center">
            <Wallet className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h2 className="text-xl font-semibold mb-2">Sign In Required</h2>
            <p className="text-muted-foreground mb-4">Paper trading requires an account to save your portfolios</p>
            <Button onClick={() => navigate('/auth')}>Sign In</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 bg-background/95 backdrop-blur-sm z-10 px-4 py-4 border-b border-border">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Paper Trading</h1>
            <p className="text-sm text-muted-foreground">Practice with simulated money</p>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => refetchPortfolio()}
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
            
            <Dialog>
              <DialogTrigger asChild>
                <Button size="sm">
                  <Plus className="h-4 w-4 mr-1" />
                  New Account
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create Paper Account</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 pt-4">
                  <div>
                    <Label>Account Name</Label>
                    <Input
                      placeholder="My Paper Portfolio"
                      value={newAccountName}
                      onChange={(e) => setNewAccountName(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label>Starting Balance</Label>
                    <Select
                      value={newAccountBalance.toString()}
                      onValueChange={(v) => setNewAccountBalance(parseInt(v))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="10000">$10,000</SelectItem>
                        <SelectItem value="25000">$25,000</SelectItem>
                        <SelectItem value="50000">$50,000</SelectItem>
                        <SelectItem value="100000">$100,000</SelectItem>
                        <SelectItem value="500000">$500,000</SelectItem>
                        <SelectItem value="1000000">$1,000,000</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button 
                    className="w-full" 
                    onClick={handleCreateAccount}
                    disabled={createAccount.isPending}
                  >
                    Create Account
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-4 space-y-6 pb-32">
        {/* Account Selector */}
        {accounts && accounts.length > 0 && (
          <div className="flex gap-2 overflow-x-auto pb-2">
            {accounts.map((account) => (
              <button
                key={account.id}
                onClick={() => setSelectedAccountId(account.id)}
                className={cn(
                  'flex-shrink-0 px-4 py-2 rounded-xl border transition-all',
                  selectedAccountId === account.id
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'bg-card border-border hover:border-primary/50'
                )}
              >
                <span className="font-medium">{account.name}</span>
              </button>
            ))}
          </div>
        )}

        {accountsLoading ? (
          <div className="flex items-center justify-center py-12">
            <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : !accounts || accounts.length === 0 ? (
          <Card>
            <CardContent className="pt-6 text-center">
              <Wallet className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Paper Accounts</h3>
              <p className="text-muted-foreground mb-4">Create a paper account to start practicing trades</p>
            </CardContent>
          </Card>
        ) : portfolio ? (
          <>
            {/* Portfolio Summary */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="pt-4">
                  <div className="flex items-center gap-2 text-muted-foreground mb-1">
                    <Wallet className="h-4 w-4" />
                    <span className="text-xs">Total Equity</span>
                  </div>
                  <p className="text-2xl font-bold">${portfolio.account.total_equity?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="pt-4">
                  <div className="flex items-center gap-2 text-muted-foreground mb-1">
                    <DollarSign className="h-4 w-4" />
                    <span className="text-xs">Cash</span>
                  </div>
                  <p className="text-2xl font-bold">${portfolio.account.current_cash?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="pt-4">
                  <div className="flex items-center gap-2 text-muted-foreground mb-1">
                    <BarChart3 className="h-4 w-4" />
                    <span className="text-xs">Holdings Value</span>
                  </div>
                  <p className="text-2xl font-bold">${portfolio.account.holdings_value?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="pt-4">
                  <div className="flex items-center gap-2 text-muted-foreground mb-1">
                    {(portfolio.account.total_pl || 0) >= 0 ? (
                      <TrendingUp className="h-4 w-4 text-signal-green" />
                    ) : (
                      <TrendingDown className="h-4 w-4 text-signal-red" />
                    )}
                    <span className="text-xs">Total P/L</span>
                  </div>
                  <p className={cn(
                    'text-2xl font-bold',
                    (portfolio.account.total_pl || 0) >= 0 ? 'text-signal-green' : 'text-signal-red'
                  )}>
                    {(portfolio.account.total_pl || 0) >= 0 ? '+' : ''}
                    ${portfolio.account.total_pl?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    <span className="text-sm ml-1">
                      ({(portfolio.account.total_pl_percent || 0) >= 0 ? '+' : ''}{portfolio.account.total_pl_percent?.toFixed(2)}%)
                    </span>
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Holdings & Orders Tabs */}
            <Tabs defaultValue="holdings" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="holdings">Holdings</TabsTrigger>
                <TabsTrigger value="orders">Order History</TabsTrigger>
              </TabsList>
              
              <TabsContent value="holdings" className="mt-4">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle className="text-lg">Positions</CardTitle>
                    <Dialog open={orderDialogOpen} onOpenChange={setOrderDialogOpen}>
                      <DialogTrigger asChild>
                        <Button size="sm">
                          <Plus className="h-4 w-4 mr-1" />
                          Trade
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Place Order</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4 pt-4">
                          <div>
                            <Label>Ticker</Label>
                            <Input
                              placeholder="e.g., NVDA"
                              value={orderTicker}
                              onChange={(e) => setOrderTicker(e.target.value.toUpperCase())}
                            />
                          </div>
                          <div>
                            <Label>Side</Label>
                            <div className="grid grid-cols-2 gap-2 mt-1">
                              <Button
                                variant={orderSide === 'buy' ? 'default' : 'outline'}
                                onClick={() => setOrderSide('buy')}
                                className={cn(orderSide === 'buy' && 'bg-signal-green hover:bg-signal-green/90')}
                              >
                                <ArrowUpRight className="h-4 w-4 mr-1" />
                                Buy
                              </Button>
                              <Button
                                variant={orderSide === 'sell' ? 'default' : 'outline'}
                                onClick={() => setOrderSide('sell')}
                                className={cn(orderSide === 'sell' && 'bg-signal-red hover:bg-signal-red/90')}
                              >
                                <ArrowDownRight className="h-4 w-4 mr-1" />
                                Sell
                              </Button>
                            </div>
                          </div>
                          <div>
                            <Label>Quantity (Shares)</Label>
                            <Input
                              type="number"
                              placeholder="100"
                              value={orderQuantity}
                              onChange={(e) => setOrderQuantity(e.target.value)}
                            />
                          </div>
                          <Button 
                            className="w-full" 
                            onClick={handlePlaceOrder}
                            disabled={placeOrder.isPending || !orderTicker || !orderQuantity}
                          >
                            {placeOrder.isPending ? 'Placing...' : 'Place Order'}
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </CardHeader>
                  <CardContent>
                    {portfolio.holdings.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        <BarChart3 className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        <p>No positions yet. Place a trade to get started.</p>
                      </div>
                    ) : (
                      <div className="divide-y divide-border">
                        {portfolio.holdings.map((holding) => (
                          <div key={holding.id} className="py-4 flex items-center justify-between">
                            <div>
                              <p className="font-medium">{holding.ticker}</p>
                              <p className="text-sm text-muted-foreground">
                                {holding.shares} shares @ ${holding.avg_cost_basis?.toFixed(2)}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="font-medium">${holding.market_value?.toFixed(2)}</p>
                              <p className={cn(
                                'text-sm',
                                (holding.unrealized_pl || 0) >= 0 ? 'text-signal-green' : 'text-signal-red'
                              )}>
                                {(holding.unrealized_pl || 0) >= 0 ? '+' : ''}
                                ${holding.unrealized_pl?.toFixed(2)} ({holding.unrealized_pl_percent?.toFixed(2)}%)
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="orders" className="mt-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <History className="h-5 w-5" />
                      Order History
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {!orders || orders.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        <History className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        <p>No orders yet</p>
                      </div>
                    ) : (
                      <div className="divide-y divide-border">
                        {orders.map((order) => (
                          <div key={order.id} className="py-3 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className={cn(
                                'w-8 h-8 rounded-lg flex items-center justify-center',
                                order.side === 'buy' ? 'bg-signal-green-bg' : 'bg-signal-red-bg'
                              )}>
                                {order.side === 'buy' ? (
                                  <ArrowUpRight className="h-4 w-4 text-signal-green" />
                                ) : (
                                  <ArrowDownRight className="h-4 w-4 text-signal-red" />
                                )}
                              </div>
                              <div>
                                <p className="font-medium">{order.ticker}</p>
                                <p className="text-xs text-muted-foreground">
                                  {order.side.toUpperCase()} {order.quantity} @ ${order.filled_price?.toFixed(2)}
                                </p>
                              </div>
                            </div>
                            <div className="text-right">
                              <span className={cn(
                                'text-xs px-2 py-0.5 rounded-full',
                                order.status === 'filled' ? 'bg-signal-green-bg text-signal-green' : 'bg-muted text-muted-foreground'
                              )}>
                                {order.status}
                              </span>
                              <p className="text-xs text-muted-foreground mt-1">
                                {new Date(order.created_at).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </>
        ) : portfolioLoading ? (
          <div className="flex items-center justify-center py-12">
            <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : null}
      </div>
    </div>
  );
}
