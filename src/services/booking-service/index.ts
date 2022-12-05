import { conflictError, notFoundError } from "@/errors";
import bookingRepository from "@/repositories/booking-repository";
import { Booking } from "@prisma/client";
import hotelService from "../hotels-service";

async function getBookingByUser(userId: number) {
  const booking = await bookingRepository.find(userId);

  if (!booking) {
    throw notFoundError();
  }

  return {
    id: booking.id,
    Room: booking.Room
  };
}

async function checkRoomAvailable(roomId: number) {
  const room = await bookingRepository.findRoom(roomId);

  if(!room) {
    throw notFoundError();
  }
  if(room.Booking.length >= room.capacity) {
    throw conflictError("selected room has no vacancy");
  }
}

async function createNewBooking({ roomId, userId }: Pick<Booking, "roomId" | "userId">) {
  await hotelService.listHotels(userId);
  await checkRoomAvailable(roomId);
  const booking = await bookingRepository.find(userId);
  if(booking) {
    throw conflictError("user already has a booking");
  }

  const newBooking = await bookingRepository.upsert(0, { roomId, userId });

  return { 
    bookingId: newBooking.id
  };
}

async function updateOneBooking({ id, roomId, userId }: Pick<Booking, "id" | "roomId" | "userId">) {
  await hotelService.listHotels(userId);
  await checkRoomAvailable(roomId);
  const booking = await bookingRepository.find(userId);
  if(!booking || booking.id !== id) {
    throw conflictError("user booking not found");
  }
  if(booking.roomId === roomId) {
    throw conflictError("user has already booked this room");
  }

  const updatedBooking = await bookingRepository.upsert(id, { roomId, userId });

  return { 
    bookingId: updatedBooking.id
  };
}

const bookingService = {
  getBookingByUser,
  createNewBooking,
  updateOneBooking
};
  
export default bookingService;
