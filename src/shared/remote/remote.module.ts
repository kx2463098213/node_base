import { Module } from "@nestjs/common";
import { HttpService } from "./http.service";
import { UserService } from "./uc/user.service";
import { UCAuthGuard } from "../../core/guards/auth.guard";

@Module({
  imports: [],
  providers: [
    UserService,
    HttpService,
    UCAuthGuard,
  ],
  exports: [
    UserService
  ],
})
export class RemoteModule { }