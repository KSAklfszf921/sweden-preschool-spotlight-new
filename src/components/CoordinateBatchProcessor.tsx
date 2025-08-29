import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { MapPin, Play, Square, RotateCcw } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useMapStore } from '@/stores/mapStore';

interface BatchProcessorProps {
  missingCoordinatesCount: number;
  onComplete?: () => void;
}

export const CoordinateBatchProcessor: React.FC<BatchProcessorProps> = ({
  missingCoordinatesCount,
  onComplete
}) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [processedCount, setProcessedCount] = useState(0);
  const [successCount, setSuccessCount] = useState(0);
  const [currentBatch, setCurrentBatch] = useState(0);
  const [totalBatches, setTotalBatches] = useState(0);
  const [results, setResults] = useState<any[]>([]);
  const { preschools } = useMapStore();
  const { toast } = useToast();

  const startBatchProcessing = async () => {
    setIsProcessing(true);
    setProgress(0);
    setProcessedCount(0);
    setSuccessCount(0);
    setResults([]);

    try {
      // Get preschools that need geocoding
      const preschoolsNeedingGeocoding = preschools.filter(p => 
        p.latitud === null || p.longitud === null || p.latitud === 0 || p.longitud === 0
      );

      if (preschoolsNeedingGeocoding.length === 0) {
        toast({
          title: "Ingen bearbetning krävs",
          description: "Alla förskolor har redan koordinater."
        });
        setIsProcessing(false);
        return;
      }

      const batchSize = 25; // Process in smaller batches
      const batches = Math.ceil(preschoolsNeedingGeocoding.length / batchSize);
      setTotalBatches(batches);

      console.log(`Starting batch processing: ${preschoolsNeedingGeocoding.length} preschools in ${batches} batches`);

      let totalProcessed = 0;
      let totalSuccessful = 0;
      const allResults: any[] = [];

      for (let i = 0; i < batches; i++) {
        setCurrentBatch(i + 1);
        const start = i * batchSize;
        const end = Math.min(start + batchSize, preschoolsNeedingGeocoding.length);
        const batch = preschoolsNeedingGeocoding.slice(start, end);

        console.log(`Processing batch ${i + 1}/${batches}: ${batch.length} preschools`);

        // Prepare data for geocoding service with proper format including Postnummer
        const preschoolsForGeocoding = batch.map(p => ({
          id: p.id,
          Namn: p.namn,
          Adress: p.adress,
          Kommun: p.kommun,
          Postnummer: null, // Will be filled if available in database
          Latitud: p.latitud,
          Longitud: p.longitud
        }));

        try {
          const { data, error } = await supabase.functions.invoke('geocoding-service', {
            body: { preschools: preschoolsForGeocoding }
          });

          if (error) {
            console.error(`Batch ${i + 1} error:`, error);
            toast({
              title: `Batch ${i + 1} misslyckades`,
              description: error.message,
              variant: "destructive"
            });
          } else if (data) {
            totalProcessed += data.processed || 0;
            totalSuccessful += data.successful || 0;
            allResults.push(...(data.results || []));
            
            console.log(`Batch ${i + 1} completed: ${data.successful}/${data.processed} successful`);
          }

        } catch (batchError) {
          console.error(`Batch ${i + 1} exception:`, batchError);
          toast({
            title: `Batch ${i + 1} fel`,
            description: `Oväntat fel: ${batchError}`,
            variant: "destructive"
          });
        }

        // Update progress
        setProcessedCount(totalProcessed);
        setSuccessCount(totalSuccessful);
        setProgress(Math.round(((i + 1) / batches) * 100));

        // Wait between batches to be respectful to the API
        if (i < batches - 1) {
          console.log(`Waiting 5 seconds before next batch...`);
          await new Promise(resolve => setTimeout(resolve, 5000));
        }
      }

      setResults(allResults);
      
      toast({
        title: "Batch-bearbetning slutförd",
        description: `${totalSuccessful} av ${totalProcessed} förskolor bearbetades framgångsrikt.`
      });

      if (onComplete) {
        onComplete();
      }

    } catch (error) {
      console.error('Batch processing error:', error);
      toast({
        title: "Bearbetningsfel",
        description: `Ett fel uppstod: ${error}`,
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const stopProcessing = () => {
    setIsProcessing(false);
    toast({
      title: "Bearbetning stoppad",
      description: "Batch-bearbetningen har stoppats."
    });
  };

  const resetProgress = () => {
    setProgress(0);
    setProcessedCount(0);
    setSuccessCount(0);
    setCurrentBatch(0);
    setTotalBatches(0);
    setResults([]);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPin className="h-5 w-5" />
          Koordinat Batch-processor
        </CardTitle>
        <CardDescription>
          Bearbeta förskolor som saknar koordinater i batch-operationer
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {missingCoordinatesCount > 0 && (
          <Alert>
            <MapPin className="h-4 w-4" />
            <AlertDescription>
              <strong>{missingCoordinatesCount}</strong> förskolor saknar koordinater och behöver bearbetas.
            </AlertDescription>
          </Alert>
        )}

        {isProcessing && (
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span>Batch {currentBatch} av {totalBatches}</span>
              <span>{successCount}/{processedCount} framgångsrika</span>
            </div>
            <Progress value={progress} className="w-full" />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Bearbetar koordinater...</span>
              <span>{progress}% färdigt</span>
            </div>
          </div>
        )}

        <div className="flex gap-2">
          {!isProcessing ? (
            <>
              <Button 
                onClick={startBatchProcessing}
                disabled={missingCoordinatesCount === 0}
                className="flex items-center gap-2"
              >
                <Play className="h-4 w-4" />
                Starta batch-bearbetning
              </Button>
              {(processedCount > 0 || results.length > 0) && (
                <Button 
                  variant="outline" 
                  onClick={resetProgress}
                  className="flex items-center gap-2"
                >
                  <RotateCcw className="h-4 w-4" />
                  Återställ
                </Button>
              )}
            </>
          ) : (
            <Button 
              variant="destructive" 
              onClick={stopProcessing}
              className="flex items-center gap-2"
            >
              <Square className="h-4 w-4" />
              Stoppa bearbetning
            </Button>
          )}
        </div>

        {results.length > 0 && (
          <div className="mt-4">
            <h4 className="font-medium mb-2">Senaste resultat:</h4>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {results.slice(-10).map((result, index) => (
                <div key={index} className="flex justify-between items-center text-sm">
                  <span className="truncate">{result.namn}</span>
                  <Badge variant={result.success ? "default" : "destructive"}>
                    {result.success ? "✓" : "✗"}
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};