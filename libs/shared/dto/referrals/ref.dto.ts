import { ApiProperty } from '@nestjs/swagger';

export class UserReferralDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  email: string;

  @ApiProperty({ required: false })
  firstName?: string;

  @ApiProperty({ required: false })
  lastName?: string;

  @ApiProperty()
  referral_code: string;

  @ApiProperty()
  credits: number;

  @ApiProperty()
  referral_level: number;

  @ApiProperty()
  referral_streak: number;

  @ApiProperty({ type: String, nullable: true })
  referral_streak_updated_at: string | null;
}
