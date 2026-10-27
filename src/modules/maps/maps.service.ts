import { ERROR_CODE } from '../../constants/error-code.js';
import { AppError } from '../../utils/AppError.js';
import { mapsClient } from './maps.client.js';

export const mapsService = {
  async search(keyword: string, provider: 'KAKAO' | 'GOOGLE' = 'KAKAO') {
    if (provider === 'GOOGLE') {
      const places = await mapsClient.searchGoogle(keyword);
      return places.map((place) => ({
        name: place.displayName.text,
        address: place.formattedAddress ?? '',
        latitude: place.location.latitude,
        longitude: place.location.longitude,
      }));
    }
    const documents = await mapsClient.search(keyword);
    return documents.map((document) => ({
      name: document.place_name,
      address: document.road_address_name || document.address_name,
      latitude: Number(document.y),
      longitude: Number(document.x),
    }));
  },

  async geocode(address: string) {
    const [document] = await mapsClient.geocode(address);
    if (!document) {
      throw new AppError(
        404,
        ERROR_CODE.MAP_API_ERROR,
        '주소에 해당하는 좌표를 찾지 못했습니다.'
      );
    }
    return {
      address: document.address_name,
      latitude: Number(document.y),
      longitude: Number(document.x),
    };
  },
};
