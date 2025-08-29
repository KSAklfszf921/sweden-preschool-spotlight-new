import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  Heart, 
  Search, 
  Trash2, 
  MapPin, 
  Star,
  Users,
  X,
  Download,
  Share2
} from 'lucide-react';
import { useMapStore } from '@/stores/mapStore';
import { supabase } from '@/integrations/supabase/client';
import { Preschool } from '@/stores/mapStore';

interface FavoritePreschool extends Preschool {
  created_at: string;
}

export const FavoritesPanel: React.FC = () => {
  const [favorites, setFavorites] = useState<FavoritePreschool[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const { setSelectedPreschool, setMapCenter } = useMapStore();

  useEffect(() => {
    loadFavorites();
  }, []);

  const loadFavorites = async () => {
    try {
      setLoading(true);
      
      // Get user favorites with preschool data
      const { data: favoritesData, error } = await supabase
        .from('user_favorites')
        .select('created_at, preschool_id')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Get preschool details for each favorite
      const preschoolIds = favoritesData?.map(fav => fav.preschool_id) || [];
      const { data: preschoolsData } = await supabase
        .from('Förskolor')
        .select('*')
        .in('id', preschoolIds);

      const favoritesWithPreschools = favoritesData
        ?.map(fav => {
          const preschool = preschoolsData?.find(p => p.id === fav.preschool_id);
          return preschool ? {
            id: preschool.id,
            namn: preschool.Namn,
            kommun: preschool.Kommun,
            adress: preschool.Adress,
            latitud: preschool.Latitud,
            longitud: preschool.Longitud,
            antal_barn: preschool['Antal barn'],
            huvudman: preschool.Huvudman,
            personaltäthet: preschool.Personaltäthet,
            andel_med_förskollärarexamen: preschool['Andel med förskollärarexamen'],
            antal_barngrupper: preschool['Antal barngrupper'],
            created_at: fav.created_at
          } : null;
        })
        .filter(Boolean) as FavoritePreschool[] || [];

      setFavorites(favoritesWithPreschools);
    } catch (error) {
      console.error('Error loading favorites:', error);
    } finally {
      setLoading(false);
    }
  };

  const removeFavorite = async (preschoolId: string) => {
    try {
      const { error } = await supabase
        .from('user_favorites')
        .delete()
        .eq('preschool_id', preschoolId);

      if (error) throw error;

      setFavorites(prev => prev.filter(f => f.id !== preschoolId));
    } catch (error) {
      console.error('Error removing favorite:', error);
    }
  };

  const viewOnMap = (preschool: FavoritePreschool) => {
    if (preschool.latitud && preschool.longitud) {
      setMapCenter([preschool.longitud, preschool.latitud]);
      setSelectedPreschool(preschool);
    }
  };

  const exportFavorites = () => {
    const csv = [
      'Namn,Kommun,Adress,Antal barn,Huvudman,Sparad datum',
      ...favorites.map(f => 
        `"${f.namn}","${f.kommun}","${f.adress}","${f.antal_barn || 'N/A'}","${f.huvudman}","${new Date(f.created_at).toLocaleDateString('sv-SE')}"`
      )
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'mina_favoritförskolor.csv';
    link.click();
  };

  const filteredFavorites = favorites.filter(f =>
    f.namn.toLowerCase().includes(searchQuery.toLowerCase()) ||
    f.kommun.toLowerCase().includes(searchQuery.toLowerCase()) ||
    f.adress?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <Card className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Heart className="h-5 w-5 text-red-500" />
          <h2 className="text-xl font-bold">Mina Favoriter</h2>
          <Badge variant="secondary">
            {favorites.length}
          </Badge>
        </div>
        
        {favorites.length > 0 && (
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={exportFavorites}
            >
              <Download className="h-4 w-4 mr-1" />
              Exportera
            </Button>
          </div>
        )}
      </div>

      {favorites.length > 0 && (
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Sök bland favoriter..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
          {searchQuery && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSearchQuery('')}
              className="absolute right-1 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      )}

      <div className="space-y-4">
        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full mx-auto mb-2"></div>
            <p className="text-sm text-muted-foreground">Laddar favoriter...</p>
          </div>
        ) : filteredFavorites.length === 0 ? (
          <div className="text-center py-8">
            <Heart className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="font-medium mb-2">
              {favorites.length === 0 
                ? 'Inga favoriter än' 
                : 'Inga favoriter matchar sökningen'
              }
            </h3>
            <p className="text-sm text-muted-foreground">
              {favorites.length === 0 
                ? 'Klicka på hjärtat på en förskola för att lägga till den som favorit'
                : 'Prova en annan sökning'
              }
            </p>
          </div>
        ) : (
          filteredFavorites.map((preschool) => (
            <Card key={preschool.id} className="p-4 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-start gap-3">
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg mb-1">
                        {preschool.namn}
                      </h3>
                      
                      <div className="flex items-center gap-2 mb-2">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">
                          {preschool.adress}, {preschool.kommun}
                        </span>
                      </div>

                      <div className="flex items-center gap-4 mb-3">
                        <Badge variant="outline">
                          {preschool.huvudman}
                        </Badge>
                        
                        {preschool.antal_barn && (
                          <div className="flex items-center gap-1">
                            <Users className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm">{preschool.antal_barn} barn</span>
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => viewOnMap(preschool)}
                        >
                          <MapPin className="h-4 w-4 mr-1" />
                          Visa på karta
                        </Button>
                        
                        <span className="text-xs text-muted-foreground">
                          Sparad {new Date(preschool.created_at).toLocaleDateString('sv-SE')}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeFavorite(preschool.id)}
                  className="text-red-500 hover:text-red-700 hover:bg-red-50"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </Card>
          ))
        )}
      </div>

      {favorites.length > 5 && (
        <div className="text-center">
          <p className="text-sm text-muted-foreground">
            Visar {filteredFavorites.length} av {favorites.length} favoriter
          </p>
        </div>
      )}
    </Card>
  );
};