/**
 * Rooms content collection — the two Kaivalyam accommodation entries.
 * --------------------------------------------------------------------
 * Feature: kaivalyam-homestay-website (task 4.2)
 *
 * _Requirements: 4.1, 4.2, 4.3, 4.4_
 */

import { kaivalyamBookingUrl } from '@/domain/integration-urls/booking-url';
import type { ImageAsset, Room } from './types';

const ROOM_BOOKING_HREF = kaivalyamBookingUrl();
const NO_PHOTOS_YET: ImageAsset[] = [];

/**
 * The duplex Luxury Cottage (Req 4.1, 4.2).
 */
export const luxuryCottage: Room = {
  id: 'luxury-cottage',
  name: 'Luxury Cottage',
  summary:
    'A private duplex cottage built for families — two levels, a roof balcony and sit-out, an indoor play area, and a garden gazebo, wrapped in hill-village quiet.',
  description:
    'The Luxury Cottage is a spacious duplex laid out for togetherness and privacy in equal measure. The ground floor opens onto the garden and a shaded gazebo; upstairs a terrace balcony and sit-out catch the cool Wayanad evenings and the sound of the plantations settling for the night. An attached bathroom with hot water, a dedicated indoor play area for little ones, and a private lounge mean a family can settle in comfortably for a long, unhurried stay. It is the most secluded corner of Kaivalyam — your own quiet world, a few steps from everything the homestay offers.',
  amenities: [
    'Duplex layout across two levels',
    'Attached bathroom with hot water',
    'TV / Mini refrigerator / Kettle & in-room tea supplies',
    'Roof balcony and private sit-out',
    'Indoor play area for children',
    'Private lounge',
    'Garden gazebo',
    'Free high-speed Wi-Fi',
    'Free on-site parking',
    'Daily housekeeping',
    'Home-cooked Malayali meals on request',
  ],
  photos: NO_PHOTOS_YET,
  bookingHref: ROOM_BOOKING_HREF,
};

/**
 * The Classic Room (Req 4.1, 4.3).
 */
export const classicRoom: Room = {
  id: 'classic-room',
  name: 'Classic Room',
  summary:
    'An affordable, cozy room with the essentials done well — comfortable, calm, and well maintained, an easy base for your Wayanad days.',
  description:
    'The Classic Room keeps things simple and restful: comfortable bedding, a clean attached bathroom with hot water, and the blissful quiet that Kaivalyam is all about. It is the affordable way to wake to birdsong and pure unpolluted air without giving up comfort or the homestay\u2019s attentive hospitality. Step out to the garden, the library, or a home-cooked meal — everything that makes a stay here feel like time is genuinely your own.',
  amenities: [
    'Comfortable double bedding',
    'Clean attached bathroom with hot water',
    'TV / Mini refrigerator / Kettle & in-room tea supplies',
    'Free high-speed Wi-Fi',
    'Free on-site parking',
    'Daily housekeeping',
    'Home-cooked Malayali meals on request',
    'Garden and library access',
  ],
  photos: NO_PHOTOS_YET,
  bookingHref: ROOM_BOOKING_HREF,
};

/**
 * Both rooms in display order (Luxury Cottage first).
 */
export const rooms: readonly Room[] = [luxuryCottage, classicRoom] as const;
