import {
  Controller,
  Get,
  Query,
  Post,
  Header,
  Redirect,
  Body,
  HttpException,
  HttpStatus,
  UseGuards,
  Param,
  Delete,
} from '@nestjs/common';
import { CatsService } from './cats.service';
import { AdoptCatDto, CreateCatDto, DeleteCatDto } from '@/modules/cats/cats.dto';
import { CommonService } from '@/modules/common/common.service';
import { CatByIdPipe } from '@/pipes/cat-by-id.pipe';
import { AuthGuard } from '@/guards/roles.guard';
import { ApiResponseMessage } from '@/decorators/api-response.decorator';

@Controller('cat')
export class CatsController {
  constructor(
    private readonly catsService: CatsService,
    private readonly commonService: CommonService
  ) {}

  @Get('detail')
  @Header('Cache-Control', 'none')
  @Header('X-Cache-Control', 'none')
  @ApiResponseMessage('获取猫咪详情成功')
  getDetail(@Query('id', CatByIdPipe) id: string) {
    this.commonService.sayHello();
    return this.catsService.getDetail(+id);
  }

  // 软删除猫咪
  @Delete('delete')
  @ApiResponseMessage('软删除猫咪成功')
  deleteCat(@Body() deleteCatDto: DeleteCatDto) {
    return this.catsService.deleteCat(deleteCatDto);
  }

  // 获取已删除的猫咪列表
  @Get('deleted')
  @ApiResponseMessage('获取已删除猫咪列表成功')
  getDeletedCats() {
    return this.catsService.getDeletedCats();
  }

  // 收养猫咪 - 主要的ADOPT逻辑
  @Post('adopt')
  @ApiResponseMessage('收养猫咪成功')
  adoptCat(@Body() adoptCatDto: AdoptCatDto) {
    return this.catsService.adoptCat(adoptCatDto);
  }

  // 获取所有可收养的猫咪
  @Get('adoptAble')
  @ApiResponseMessage('获取可收养猫咪列表成功')
  getAvailableCats() {
    return this.catsService.getAvailableCats();
  }

  // 获取用户收养的所有猫咪
  @Get('owner')
  @ApiResponseMessage('获取用户收养的猫咪列表成功')
  getCatsByOwner(@Query('userId', CatByIdPipe) userId: number) {
    return this.catsService.getCatsByOwner(userId);
  }

  @Get('num')
  getCatsNum() {
    return this.catsService.getCatsNum();
  }

  @Post('insert')
  addCatsNum(@Body() createCatDeo: CreateCatDto) {
    createCatDeo.sayHi();
    return this.catsService.insertCat(createCatDeo);
  }

  @Get('/redirect')
  @Redirect('/cat/num')
  redirect() {}

  @Get('/lost')
  catLost() {
    throw new HttpException('Cat Lost', HttpStatus.NOT_FOUND, {
      cause: new Error(),
      description: 'Cats Lost',
    });
  }

  @Get('guard')
  @UseGuards(AuthGuard)
  catGuard() {
    return 'Cats Guard';
  }
}
