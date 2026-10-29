import {
  MENU,
  MENU_AUDIENCES,
  MENU_ICONS,
  MENU_ITEM_KINDS,
  type MenuAudience,
  type MenuIcon,
  type MenuItemKind,
} from '@formula/shared';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsIn,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  MaxLength,
  MinLength,
  ValidateIf,
} from 'class-validator';

const trim = ({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value);

/** Only paths inside the site: a menu item must never lead to another domain. */
const INTERNAL_PATH = /^\/(?!\/)[\w\-./]*$/;

export class CreateMenuItemDto {
  @ApiProperty({ enum: MENU_AUDIENCES })
  @IsIn(MENU_AUDIENCES)
  audience!: MenuAudience;

  @ApiProperty({ maxLength: MENU.LABEL_MAX_LENGTH })
  @Transform(trim)
  @IsString()
  @MinLength(1)
  @MaxLength(MENU.LABEL_MAX_LENGTH)
  label!: string;

  @ApiProperty({
    enum: MENU_ITEM_KINDS,
    description: '"link" opens a path of the site, "page" opens a page with its own text',
  })
  @IsIn(MENU_ITEM_KINDS)
  kind!: MenuItemKind;

  @ApiPropertyOptional({
    example: '/cabinet/news',
    description: 'Required for links; pages get their own address',
  })
  @ValidateIf((item: CreateMenuItemDto) => item.kind === 'link')
  @Transform(trim)
  @IsString()
  @MaxLength(MENU.HREF_MAX_LENGTH)
  @Matches(INTERNAL_PATH, { message: 'href must be a path inside the site' })
  href?: string;

  @ApiProperty({ enum: MENU_ICONS })
  @IsIn(MENU_ICONS)
  icon!: MenuIcon;
}

export class UpdateMenuItemDto {
  @ApiPropertyOptional({ maxLength: MENU.LABEL_MAX_LENGTH })
  @IsOptional()
  @Transform(trim)
  @IsString()
  @MinLength(1)
  @MaxLength(MENU.LABEL_MAX_LENGTH)
  label?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Transform(trim)
  @IsString()
  @MaxLength(MENU.HREF_MAX_LENGTH)
  @Matches(INTERNAL_PATH, { message: 'href must be a path inside the site' })
  href?: string;

  @ApiPropertyOptional({ enum: MENU_ICONS })
  @IsOptional()
  @IsIn(MENU_ICONS)
  icon?: MenuIcon;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class ReorderMenuDto {
  @ApiProperty({ enum: MENU_AUDIENCES })
  @IsIn(MENU_AUDIENCES)
  audience!: MenuAudience;

  @ApiProperty({ type: [String], description: 'Item ids in the new order' })
  @IsArray()
  @ArrayMaxSize(100)
  @IsUUID('all', { each: true })
  ids!: string[];
}

export class UpdateMenuPageDto {
  @ApiProperty({ description: 'Rich text from the editor; sanitized before it is stored' })
  @IsString()
  @MaxLength(MENU.PAGE_MAX_LENGTH)
  bodyHtml!: string;
}
