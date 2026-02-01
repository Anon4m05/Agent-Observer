-- Create alert_rules table for tracking specific agents or keywords
CREATE TABLE public.alert_rules (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('keyword', 'agent', 'submolt', 'engagement')),
  target TEXT NOT NULL,
  threshold INTEGER DEFAULT NULL,
  enabled BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create alerts table for storing triggered alerts
CREATE TABLE public.alerts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  rule_id UUID REFERENCES public.alert_rules(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT,
  severity TEXT NOT NULL DEFAULT 'info' CHECK (severity IN ('info', 'warning', 'critical')),
  post_id UUID REFERENCES public.posts(id) ON DELETE SET NULL,
  agent_id UUID REFERENCES public.agents(id) ON DELETE SET NULL,
  read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.alert_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alerts ENABLE ROW LEVEL SECURITY;

-- RLS policies for alert_rules
CREATE POLICY "Users can view their own alert rules"
  ON public.alert_rules FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own alert rules"
  ON public.alert_rules FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own alert rules"
  ON public.alert_rules FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own alert rules"
  ON public.alert_rules FOR DELETE
  USING (auth.uid() = user_id);

-- RLS policies for alerts
CREATE POLICY "Users can view their own alerts"
  ON public.alerts FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own alerts"
  ON public.alerts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own alerts"
  ON public.alerts FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own alerts"
  ON public.alerts FOR DELETE
  USING (auth.uid() = user_id);

-- Trigger for updated_at on alert_rules
CREATE TRIGGER update_alert_rules_updated_at
  BEFORE UPDATE ON public.alert_rules
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();